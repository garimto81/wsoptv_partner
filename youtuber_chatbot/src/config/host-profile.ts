/**
 * Host Profile Loader
 *
 * 호스트 프로필을 파일 또는 환경 변수에서 로드합니다.
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { HostProfile, HostProject } from '../types/host.js';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로젝트 루트 기준 설정 파일 경로
const CONFIG_DIR = join(__dirname, '..', '..', 'config');
const PROFILE_PATH = join(CONFIG_DIR, 'host-profile.json');

/**
 * 기본 호스트 프로필
 */
const DEFAULT_PROFILE: HostProfile = {
  host: {
    name: 'Developer',
    displayName: 'AI Coding Streamer',
    bio: '코딩과 AI를 사랑하는 개발자입니다.',
  },
  persona: {
    role: 'AI 코딩 방송 어시스턴트',
    tone: '친절하고 전문적인 말투로 답변합니다.',
    primaryLanguages: ['TypeScript', 'Python'],
    expertise: ['웹 개발', 'AI/ML', '클라우드'],
  },
  social: {
    github: undefined,
    twitter: undefined,
    website: undefined,
  },
  projects: [],
  meta: {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
  },
};

/**
 * 호스트 프로필 로더 클래스
 */
export class HostProfileLoader {
  private profile: HostProfile | null = null;
  private profilePath: string;

  constructor(profilePath?: string) {
    this.profilePath = profilePath || PROFILE_PATH;
  }

  /**
   * 프로필 로드
   */
  async load(): Promise<HostProfile> {
    // 1. 환경 변수에서 직접 로드 시도
    if (process.env.HOST_PROFILE_JSON) {
      try {
        this.profile = JSON.parse(process.env.HOST_PROFILE_JSON);
        console.log('[Config] Host profile loaded from environment variable');
        return this.profile!;
      } catch (error) {
        console.warn('[Config] Failed to parse HOST_PROFILE_JSON:', error);
      }
    }

    // 2. 설정 파일에서 로드
    if (existsSync(this.profilePath)) {
      try {
        const content = await readFile(this.profilePath, 'utf-8');
        this.profile = JSON.parse(content);
        console.log(`[Config] Host profile loaded from ${this.profilePath}`);
        return this.profile!;
      } catch (error) {
        console.warn('[Config] Failed to load profile file:', error);
      }
    }

    // 3. 환경 변수에서 개별 필드 조합
    this.profile = this.buildFromEnv();
    console.log('[Config] Host profile built from environment variables');

    return this.profile;
  }

  /**
   * 환경 변수에서 프로필 구성
   */
  private buildFromEnv(): HostProfile {
    const profile: HostProfile = {
      ...DEFAULT_PROFILE,
      host: {
        name: process.env.HOST_NAME || DEFAULT_PROFILE.host.name,
        displayName: process.env.HOST_DISPLAY_NAME || DEFAULT_PROFILE.host.displayName,
        bio: process.env.HOST_BIO || DEFAULT_PROFILE.host.bio,
      },
      social: {
        github: process.env.GITHUB_USERNAME || undefined,
        twitter: process.env.TWITTER_HANDLE || undefined,
        website: process.env.HOST_WEBSITE || undefined,
      },
    };

    return profile;
  }

  /**
   * GitHub 프로젝트 병합
   */
  async mergeGitHubProjects(projects: HostProject[]): Promise<void> {
    if (!this.profile) {
      await this.load();
    }

    // 기존 GitHub 프로젝트 제거 (수동 추가 유지)
    const manualProjects = this.profile!.projects.filter(
      (p) => p.source !== 'github',
    );

    // GitHub 프로젝트 추가
    const githubProjects = projects.map((p) => ({
      ...p,
      source: 'github' as const,
      lastSyncedAt: new Date().toISOString(),
    }));

    this.profile!.projects = [...manualProjects, ...githubProjects];
    this.profile!.meta = {
      ...this.profile!.meta,
      version: this.profile!.meta?.version || '1.0.0',
      lastUpdated: new Date().toISOString(),
    };

    // 파일에 저장
    await this.save();
  }

  /**
   * 프로필 저장
   */
  async save(): Promise<void> {
    if (!this.profile) {
      throw new Error('No profile to save');
    }

    // config 디렉토리 생성
    const { mkdir } = await import('fs/promises');
    await mkdir(dirname(this.profilePath), { recursive: true });

    await writeFile(
      this.profilePath,
      JSON.stringify(this.profile, null, 2),
      'utf-8',
    );
    console.log(`[Config] Profile saved to ${this.profilePath}`);
  }

  /**
   * 현재 프로필 반환
   */
  getProfile(): HostProfile | null {
    return this.profile;
  }
}

// 싱글톤 인스턴스
let loaderInstance: HostProfileLoader | null = null;

/**
 * 호스트 프로필 로더 인스턴스 반환
 */
export function getHostProfileLoader(): HostProfileLoader {
  if (!loaderInstance) {
    loaderInstance = new HostProfileLoader();
  }
  return loaderInstance;
}
