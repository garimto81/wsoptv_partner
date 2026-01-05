/**
 * Config Module
 *
 * 호스트 프로필을 로드하고 관리하는 설정 모듈입니다.
 */

import type { HostProfile } from '../types/host.js';
import { HostProfileLoader } from './host-profile.js';

// 싱글톤 인스턴스
let cachedProfile: HostProfile | null = null;
let loader: HostProfileLoader | null = null;

/**
 * 호스트 프로필 로드 (비동기)
 *
 * 앱 시작 시 최초 1회 호출합니다.
 * 환경 변수 또는 기본 설정 파일에서 프로필을 로드합니다.
 */
export async function loadHostProfile(): Promise<HostProfile> {
  if (cachedProfile) {
    return cachedProfile;
  }

  loader = new HostProfileLoader();
  cachedProfile = await loader.load();

  return cachedProfile;
}

/**
 * 호스트 프로필 조회 (동기)
 *
 * loadHostProfile()가 먼저 호출되어야 합니다.
 * @throws 프로필이 로드되지 않은 경우 에러
 */
export function getHostProfile(): HostProfile {
  if (!cachedProfile) {
    throw new Error(
      'Host profile not loaded. Call loadHostProfile() first.',
    );
  }
  return cachedProfile;
}

/**
 * 프로필 캐시 갱신
 */
export async function refreshHostProfile(): Promise<HostProfile> {
  cachedProfile = null;
  return loadHostProfile();
}

/**
 * 프로필 로더 인스턴스 반환
 */
export function getProfileLoader(): HostProfileLoader {
  if (!loader) {
    loader = new HostProfileLoader();
  }
  return loader;
}
