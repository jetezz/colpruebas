#!/usr/bin/env bun
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const PACKAGE_ID = 'projectctl2';
const ROOT_SKILL = 'SKILL.md';
const RELEASE_MANIFEST = 'skill-release.json';
const HASH_SCHEME = 'projectctl2-tree-v1';
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

type RecordValue = Record<string, unknown>;
type PackageMetadata = { id: string; version: string };
type ReleaseManifest = {
  schema_version: 1;
  id: string;
  version: string;
  algorithm: 'sha256';
  scheme: typeof HASH_SCHEME;
  digest: string;
  file_count: number;
};
type TreeDigest = { digest: string; file_count: number };
type CliOptions = { root: string; json: boolean; command: string; level?: string };

const isRecord = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value);
const isSemver = (value: unknown): value is string => typeof value === 'string' && SEMVER.test(value);

function usage() {
  return `projectctl2 package version and SHA validator

Usage:
  bun skill-version.ts init [--root DIR]
  bun skill-version.ts check [--root DIR] [--json]
  bun skill-version.ts sha [--root DIR] [--json]
  bun skill-version.ts bump <patch|minor|major> [--root DIR] [--json]

Commands:
  init             Create the initial skill-release.json from root SKILL.md metadata
  check            Verify metadata and the recorded SHA-256 of the complete package tree
  sha              Print the current SHA-256 candidate without changing package files
  bump LEVEL       Increment SemVer and refresh the release manifest atomically

If --root is omitted, the package root containing this script is used.`;
}

function parseArgs(argv: string[]): CliOptions {
  const args = [...argv];
  const command = args.shift();
  if (!command || command === '--help' || command === '-h') return { command: 'help', root: resolve(import.meta.dir, '..'), json: false };
  let level: string | undefined;
  if (command === 'bump') level = args.shift();
  let root = resolve(import.meta.dir, '..');
  let json = false;
  let sawRoot = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--json') { json = true; continue; }
    if (arg === '--root' || arg.startsWith('--root=')) {
      if (sawRoot) throw new Error('Pass --root only once.');
      sawRoot = true;
      const value = arg === '--root' ? args[++i] : arg.slice('--root='.length);
      if (!value || value.startsWith('--')) throw new Error('Missing value for --root.');
      root = resolve(value);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['init', 'check', 'sha', 'bump'].includes(command)) throw new Error(`Unknown command: ${command}`);
  if (command === 'bump' && !['patch', 'minor', 'major'].includes(level ?? '')) throw new Error('bump requires one level: patch, minor, or major.');
  if (command !== 'bump' && level !== undefined) throw new Error(`Unexpected positional argument: ${level}`);
  return { command, level, root, json };
}

function readRootSkill(root: string): { content: string; metadata: PackageMetadata } {
  const file = join(root, ROOT_SKILL);
  let content: string;
  try { content = readFileSync(file, 'utf8'); }
  catch { throw new Error(`Required package entry is missing: ${file}`); }
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(content);
  if (!match) throw new Error(`${ROOT_SKILL} must start with YAML frontmatter.`);
  let frontmatter: unknown;
  try { frontmatter = Bun.YAML.parse(match[2]!); }
  catch (error) { throw new Error(`${ROOT_SKILL} frontmatter is invalid YAML: ${error instanceof Error ? error.message : String(error)}`); }
  if (!isRecord(frontmatter) || frontmatter.name !== PACKAGE_ID || !isRecord(frontmatter.metadata)) {
    throw new Error(`${ROOT_SKILL} must declare name: ${PACKAGE_ID} and metadata.id/version.`);
  }
  if (frontmatter.metadata.id !== PACKAGE_ID) throw new Error(`${ROOT_SKILL} metadata.id must be ${PACKAGE_ID}.`);
  if (!isSemver(frontmatter.metadata.version)) throw new Error(`${ROOT_SKILL} metadata.version must be strict MAJOR.MINOR.PATCH SemVer.`);
  return { content, metadata: { id: PACKAGE_ID, version: frontmatter.metadata.version } };
}

function updateRootVersion(content: string, version: string): string {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(content);
  if (!match) throw new Error(`${ROOT_SKILL} frontmatter is invalid.`);
  const lines = match[2]!.split(/(?<=\n)/);
  let insideMetadata = false;
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const line = rawLine.replace(/\r?\n$/, '');
    if (/^metadata\s*:\s*$/.test(line)) { insideMetadata = true; continue; }
    if (!insideMetadata || !line.trim()) continue;
    const indentation = line.match(/^\s*/)?.[0].length ?? 0;
    if (indentation === 0) { insideMetadata = false; continue; }
    if (indentation === 2 && /^\s*version\s*:/.test(line)) {
      const ending = rawLine.match(/\r?\n$/)?.[0] ?? '';
      lines[i] = `  version: ${version}${ending}`;
      replaced = true;
      break;
    }
  }
  if (!replaced) throw new Error(`${ROOT_SKILL} metadata.version field was not found at the expected indentation.`);
  return `${match[1]}${lines.join('')}${match[3]}${content.slice(match[0].length)}`;
}

function byteLengthPrefix(length: number): Buffer {
  const prefix = Buffer.alloc(8);
  prefix.writeBigUInt64BE(BigInt(length));
  return prefix;
}

function compareUtf8(a: string, b: string): number {
  return Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

function treeDigest(root: string, overrides: ReadonlyMap<string, Buffer> = new Map()): TreeDigest {
  const skillRoot = resolve(root);
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => compareUtf8(a.name, b.name))) {
      const absolutePath = join(directory, entry.name);
      const stat = lstatSync(absolutePath);
      if (stat.isSymbolicLink()) throw new Error(`Symlinks are not included in the package hash: ${relative(skillRoot, absolutePath)}`);
      if (stat.isDirectory()) { visit(absolutePath); continue; }
      if (!stat.isFile()) throw new Error(`Special files cannot be hashed: ${relative(skillRoot, absolutePath)}`);
      const relativePath = relative(skillRoot, absolutePath).split(sep).join('/');
      if (relativePath === RELEASE_MANIFEST) continue;
      files.push(relativePath);
    }
  };
  try { visit(skillRoot); }
  catch (error) { throw new Error(`Cannot inventory skill tree: ${error instanceof Error ? error.message : String(error)}`); }
  files.sort(compareUtf8);

  const hash = createHash('sha256');
  hash.update(`${HASH_SCHEME}\0`, 'utf8');
  for (const file of files) {
    const filePath = join(skillRoot, ...file.split('/'));
    const stat = lstatSync(filePath);
    const bytes = overrides.get(file) ?? readFileSync(filePath);
    const pathBytes = Buffer.from(file, 'utf8');
    const executable = Buffer.from([stat.mode & 0o111 ? 1 : 0]);
    hash.update(byteLengthPrefix(pathBytes.length));
    hash.update(pathBytes);
    hash.update(executable);
    hash.update(byteLengthPrefix(bytes.length));
    hash.update(bytes);
  }
  return { digest: hash.digest('hex'), file_count: files.length };
}

function manifestPath(root: string): string { return join(root, RELEASE_MANIFEST); }

function readManifest(root: string): ReleaseManifest {
  const file = manifestPath(root);
  let raw: unknown;
  try { raw = JSON.parse(readFileSync(file, 'utf8')); }
  catch { throw new Error(`${RELEASE_MANIFEST} is missing or invalid JSON. Run init once or restore the last valid manifest.`); }
  if (!isRecord(raw) || Object.keys(raw).some(key => !['schema_version', 'id', 'version', 'algorithm', 'scheme', 'digest', 'file_count'].includes(key)) ||
      raw.schema_version !== 1 || raw.id !== PACKAGE_ID || !isSemver(raw.version) || raw.algorithm !== 'sha256' || raw.scheme !== HASH_SCHEME ||
      typeof raw.digest !== 'string' || !/^[a-f0-9]{64}$/.test(raw.digest) || !Number.isSafeInteger(raw.file_count) || (raw.file_count as number) < 1) {
    throw new Error(`${RELEASE_MANIFEST} has an invalid schema or package identity.`);
  }
  return raw as ReleaseManifest;
}

function createManifest(metadata: PackageMetadata, tree: TreeDigest): ReleaseManifest {
  return {
    schema_version: 1,
    id: metadata.id,
    version: metadata.version,
    algorithm: 'sha256',
    scheme: HASH_SCHEME,
    digest: tree.digest,
    file_count: tree.file_count,
  };
}

function writeInitialManifest(root: string, manifest: ReleaseManifest) {
  const target = manifestPath(root);
  if (existsSync(target)) throw new Error(`${RELEASE_MANIFEST} already exists; init is only for the first release.`);
  const temp = `${target}.tmp.${process.pid}.${randomUUID()}`;
  try {
    writeFileSync(temp, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o644 });
    renameSync(temp, target);
  } catch (error) {
    if (existsSync(temp)) unlinkSync(temp);
    throw error;
  }
}

function writeReleasePair(root: string, skillContent: string, manifest: ReleaseManifest) {
  const skillFile = join(root, ROOT_SKILL);
  const manifestFile = manifestPath(root);
  const suffix = `.tmp.${process.pid}.${randomUUID()}`;
  const skillTemp = `${skillFile}${suffix}`;
  const manifestTemp = `${manifestFile}${suffix}`;
  const skillBackup = `${skillFile}${suffix}.bak`;
  const manifestBackup = `${manifestFile}${suffix}.bak`;
  const skillMode = lstatSync(skillFile).mode & 0o777;
  const manifestMode = lstatSync(manifestFile).mode & 0o777;
  let skillBackedUp = false;
  let manifestBackedUp = false;
  let skillInstalled = false;
  let manifestInstalled = false;
  try {
    writeFileSync(skillTemp, skillContent, { flag: 'wx', mode: skillMode });
    writeFileSync(manifestTemp, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: manifestMode });
    renameSync(skillFile, skillBackup); skillBackedUp = true;
    renameSync(manifestFile, manifestBackup); manifestBackedUp = true;
    renameSync(skillTemp, skillFile); skillInstalled = true;
    renameSync(manifestTemp, manifestFile); manifestInstalled = true;
  } catch (error) {
    if (manifestInstalled && existsSync(manifestFile)) unlinkSync(manifestFile);
    if (skillInstalled && existsSync(skillFile)) unlinkSync(skillFile);
    if (manifestBackedUp && existsSync(manifestBackup)) renameSync(manifestBackup, manifestFile);
    if (skillBackedUp && existsSync(skillBackup)) renameSync(skillBackup, skillFile);
    if (existsSync(skillTemp)) unlinkSync(skillTemp);
    if (existsSync(manifestTemp)) unlinkSync(manifestTemp);
    throw new Error(`Could not atomically update version and manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    unlinkSync(skillBackup);
    unlinkSync(manifestBackup);
  } catch (error) {
    throw new Error(`Version and manifest were updated, but temporary backup cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function nextVersion(version: string, level: string): string {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`Invalid SemVer version: ${version}`);
  let [major, minor, patch] = match.slice(1).map(Number);
  if (![major, minor, patch].every(Number.isSafeInteger)) throw new Error('Version component exceeds safe integer range.');
  if (level === 'patch') patch++;
  else if (level === 'minor') { minor++; patch = 0; }
  else if (level === 'major') { major++; minor = 0; patch = 0; }
  else throw new Error('Version bump level must be patch, minor, or major.');
  if (![major, minor, patch].every(Number.isSafeInteger)) throw new Error('Version component exceeds safe integer range.');
  return `${major}.${minor}.${patch}`;
}

function emit(options: CliOptions, data: RecordValue, human: string) {
  if (options.json) console.log(JSON.stringify(data, null, 2));
  else console.log(human);
}

function main() {
  let options: CliOptions;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`${error instanceof Error ? error.message : String(error)}\n\n${usage()}`); process.exit(2); }
  if (options.command === 'help') { console.log(usage()); return; }

  try {
    const { metadata } = readRootSkill(options.root);
    if (options.command === 'init') {
      const tree = treeDigest(options.root);
      writeInitialManifest(options.root, createManifest(metadata, tree));
      emit(options, { initialized: true, id: metadata.id, version: metadata.version, digest: `sha256:${tree.digest}`, file_count: tree.file_count }, `Initialized ${metadata.id}@${metadata.version} with sha256:${tree.digest} (${tree.file_count} files).`);
      return;
    }

    const tree = treeDigest(options.root);
    if (options.command === 'sha') {
      emit(options, { id: metadata.id, version: metadata.version, digest: `sha256:${tree.digest}`, file_count: tree.file_count }, `sha256:${tree.digest} (${tree.file_count} files; preview only).`);
      return;
    }

    const manifest = readManifest(options.root);
    if (manifest.id !== metadata.id) throw new Error(`Package ID mismatch: SKILL.md=${metadata.id}, ${RELEASE_MANIFEST}=${manifest.id}.`);
    if (manifest.version !== metadata.version) throw new Error(`Version mismatch: SKILL.md=${metadata.version}, ${RELEASE_MANIFEST}=${manifest.version}. Use bump to change the version.`);

    if (options.command === 'check') {
      if (manifest.digest !== tree.digest || manifest.file_count !== tree.file_count) {
        throw new Error(`Skill tree is dirty: recorded sha256:${manifest.digest} (${manifest.file_count} files), current sha256:${tree.digest} (${tree.file_count} files). Run bump patch|minor|major.`);
      }
      emit(options, { valid: true, id: metadata.id, version: metadata.version, digest: `sha256:${tree.digest}`, file_count: tree.file_count }, `Valid ${metadata.id}@${metadata.version}: sha256:${tree.digest} (${tree.file_count} files).`);
      return;
    }

    if (options.command === 'bump') {
      if (manifest.digest === tree.digest && manifest.file_count === tree.file_count) throw new Error('No package changes detected; refusing an unnecessary version bump.');
      const bumpedVersion = nextVersion(metadata.version, options.level!);
      const skillContent = readFileSync(join(options.root, ROOT_SKILL), 'utf8');
      const updatedSkill = updateRootVersion(skillContent, bumpedVersion);
      const updatedTree = treeDigest(options.root, new Map([[ROOT_SKILL, Buffer.from(updatedSkill, 'utf8')]]));
      const updatedManifest = createManifest({ id: metadata.id, version: bumpedVersion }, updatedTree);
      writeReleasePair(options.root, updatedSkill, updatedManifest);
      emit(options, { bumped: true, id: metadata.id, previous_version: metadata.version, version: bumpedVersion, level: options.level, digest: `sha256:${updatedTree.digest}`, file_count: updatedTree.file_count }, `Bumped ${metadata.version} -> ${bumpedVersion} (${options.level}); sha256:${updatedTree.digest}.`);
      return;
    }
    throw new Error(`Unsupported command: ${options.command}`);
  } catch (error) {
    if (options.json) console.log(JSON.stringify({ valid: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    else console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.main) main();
