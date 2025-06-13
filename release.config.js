module.exports = {
    branches: ["master"],
    plugins: [
      "@semantic-release/commit-analyzer", // phân tích commit
      "@semantic-release/release-notes-generator", // tạo changelog
      ["@semantic-release/changelog", {
        changelogFile: "CHANGELOG.md"
      }],
      ["@semantic-release/git", {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }],
      "@semantic-release/github"
    ]
  };
  