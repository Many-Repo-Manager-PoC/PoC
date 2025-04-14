import type { Octokit } from "octokit";

// Define a type for the Octokit instance
export type OctokitInstance = InstanceType<typeof Octokit>;

// Use a more flexible type that matches the Octokit response
export type Repository = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count?: number;
  forks_count?: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  language?: string;
  topics?: string[];
  default_branch: string;
  clone_url: string;
  created_at: string;
  pushed_at: string;
  size: number;
  visibility: string;
};

// Type for monorepo packages
export type MonorepoPackage = {
  name: string;
  path: string;
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
};

// Type for design system dependencies
export type DesignSystemDependency = {
  name: string;
  version: string;
  repo?: Repository;
};

// Type for package.json data
export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}
