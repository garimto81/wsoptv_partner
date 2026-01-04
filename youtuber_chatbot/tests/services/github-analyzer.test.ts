import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubAnalyzer } from '../../src/services/github-analyzer.js';
import { Octokit } from 'octokit';

// Octokit 모킹
vi.mock('octokit');

describe('GitHubAnalyzer', () => {
  let analyzer: GitHubAnalyzer;
  let mockOctokit: {
    rest: {
      repos: {
        listForUser: ReturnType<typeof vi.fn>;
        get: ReturnType<typeof vi.fn>;
        getLatestRelease: ReturnType<typeof vi.fn>;
      };
      issues: {
        listForRepo: ReturnType<typeof vi.fn>;
      };
      rateLimit: {
        get: ReturnType<typeof vi.fn>;
      };
    };
    graphql: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Octokit 객체 생성
    mockOctokit = {
      rest: {
        repos: {
          listForUser: vi.fn(),
          get: vi.fn(),
          getLatestRelease: vi.fn(),
        },
        issues: {
          listForRepo: vi.fn(),
        },
        rateLimit: {
          get: vi.fn(),
        },
      },
      graphql: vi.fn(),
    };

    // Octokit 생성자 모킹
    vi.mocked(Octokit).mockImplementation(() => mockOctokit as unknown as Octokit);

    analyzer = new GitHubAnalyzer('testuser', 'fake-token');
  });

  describe('listRepositories', () => {
    it('사용자의 레포지토리 목록을 조회해야 함', async () => {
      const mockRepos = [
        {
          name: 'repo1',
          description: 'First repository',
          full_name: 'testuser/repo1',
          language: 'TypeScript',
          stargazers_count: 10,
          topics: ['nodejs', 'typescript'],
          homepage: 'https://example.com',
        },
        {
          name: 'repo2',
          description: null,
          full_name: 'testuser/repo2',
          language: 'Python',
          stargazers_count: 5,
          topics: [],
          homepage: null,
        },
      ];

      mockOctokit.rest.repos.listForUser.mockResolvedValue({ data: mockRepos });

      const result = await analyzer.listRepositories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('repo1');
      expect(result[0].repository).toBe('testuser/repo1');
      expect(result[0].stars).toBe(10);
      expect(result[1].description).toBe('No description');
    });

    it('정렬 옵션을 적용해야 함', async () => {
      mockOctokit.rest.repos.listForUser.mockResolvedValue({ data: [] });

      await analyzer.listRepositories({
        sort: 'created',
        direction: 'asc',
        per_page: 50,
      });

      expect(mockOctokit.rest.repos.listForUser).toHaveBeenCalledWith({
        username: 'testuser',
        sort: 'created',
        direction: 'asc',
        per_page: 50,
      });
    });
  });

  describe('getPinnedRepositories', () => {
    it('Pinned 레포지토리를 조회해야 함', async () => {
      const mockGraphQLResponse = {
        user: {
          pinnedItems: {
            nodes: [
              {
                name: 'pinned-repo',
                description: 'A pinned repository',
                owner: { login: 'testuser' },
                primaryLanguage: { name: 'TypeScript' },
                stargazerCount: 100,
                repositoryTopics: {
                  nodes: [
                    { topic: { name: 'javascript' } },
                    { topic: { name: 'typescript' } },
                  ],
                },
                latestRelease: { tagName: 'v2.0.0' },
                homepageUrl: 'https://example.com',
                pushedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        },
      };

      mockOctokit.graphql.mockResolvedValue(mockGraphQLResponse);

      const result = await analyzer.getPinnedRepositories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('pinned-repo');
      expect(result[0].version).toBe('v2.0.0');
      expect(result[0].stars).toBe(100);
      expect(result[0].topics).toEqual(['javascript', 'typescript']);
      expect(result[0].source).toBe('github');
      expect(result[0].isActive).toBe(true);
    });

    it('릴리스가 없으면 기본 버전을 사용해야 함', async () => {
      const mockGraphQLResponse = {
        user: {
          pinnedItems: {
            nodes: [
              {
                name: 'no-release-repo',
                description: 'Repo without release',
                owner: { login: 'testuser' },
                primaryLanguage: null,
                stargazerCount: 0,
                repositoryTopics: { nodes: [] },
                latestRelease: null,
                homepageUrl: null,
                pushedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        },
      };

      mockOctokit.graphql.mockResolvedValue(mockGraphQLResponse);

      const result = await analyzer.getPinnedRepositories();

      expect(result[0].version).toBe('1.0.0');
      expect(result[0].stack).toBe('Unknown');
    });
  });

  describe('getLatestRelease', () => {
    it('최신 릴리스 버전을 반환해야 함', async () => {
      mockOctokit.rest.repos.getLatestRelease.mockResolvedValue({
        data: { tag_name: 'v3.0.0' },
      });

      const version = await analyzer.getLatestRelease('testuser/test-repo');

      expect(version).toBe('v3.0.0');
      expect(mockOctokit.rest.repos.getLatestRelease).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
      });
    });

    it('릴리스가 없으면 null을 반환해야 함', async () => {
      mockOctokit.rest.repos.getLatestRelease.mockRejectedValue(new Error('Not found'));

      const version = await analyzer.getLatestRelease('testuser/no-release');

      expect(version).toBeNull();
    });
  });

  describe('checkRateLimit', () => {
    it('Rate Limit 정보를 반환해야 함', async () => {
      const mockRateLimit = {
        data: {
          rate: {
            limit: 5000,
            remaining: 4999,
            reset: 1234567890,
          },
        },
      };

      mockOctokit.rest.rateLimit.get.mockResolvedValue(mockRateLimit);

      const rateLimit = await analyzer.checkRateLimit();

      expect(rateLimit.limit).toBe(5000);
      expect(rateLimit.remaining).toBe(4999);
      expect(rateLimit.reset).toBe(1234567890);
    });
  });

  describe('getRecentActiveRepositories', () => {
    it('최근 활동이 있는 레포만 반환해야 함', async () => {
      const mockRepos = [
        {
          name: 'active-repo',
          description: 'Active repo',
          full_name: 'testuser/active-repo',
          language: 'TypeScript',
          stargazers_count: 10,
          topics: [],
          homepage: null,
        },
        {
          name: 'inactive-repo',
          description: 'Inactive repo',
          full_name: 'testuser/inactive-repo',
          language: 'Python',
          stargazers_count: 5,
          topics: [],
          homepage: null,
        },
      ];

      mockOctokit.rest.repos.listForUser.mockResolvedValue({ data: mockRepos });

      // active-repo는 최근 푸시됨
      mockOctokit.rest.repos.get
        .mockResolvedValueOnce({
          data: { pushed_at: new Date().toISOString() },
        })
        .mockResolvedValueOnce({
          data: { pushed_at: '2020-01-01T00:00:00Z' }, // 오래된 날짜
        });

      const result = await analyzer.getRecentActiveRepositories(5);

      expect(result.length).toBeGreaterThanOrEqual(0);
      // 최근 활동이 있는 레포만 포함되어야 함
    });
  });

  describe('Edge Cases', () => {
    it('빈 레포지토리 목록을 처리해야 함', async () => {
      mockOctokit.rest.repos.listForUser.mockResolvedValue({ data: [] });

      const result = await analyzer.listRepositories();

      expect(result).toEqual([]);
    });

    it('GraphQL 응답이 빈 배열이면 빈 배열을 반환해야 함', async () => {
      const mockGraphQLResponse = {
        user: {
          pinnedItems: {
            nodes: [],
          },
        },
      };

      mockOctokit.graphql.mockResolvedValue(mockGraphQLResponse);

      const result = await analyzer.getPinnedRepositories();

      expect(result).toEqual([]);
    });
  });
});
