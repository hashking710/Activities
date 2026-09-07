<div align="center">
  <img src="https://avatars.githubusercontent.com/u/276088231?s=256" alt="Hash King" width="120" height="120">
  <h1>Hash King's PreMiD Activities</h1>
  <p>A personal fork of PreMiD Activities for experiments, maintained presences, and private development.</p>
  <p>
    <a href="https://hashking.dev"><img src="https://img.shields.io/badge/portfolio-hashking.dev-111111?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Portfolio"></a>
    <a href="https://discord.gg/J7QBvvwhab"><img src="https://img.shields.io/badge/Discord-private%20dev-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Private development Discord"></a>
    <a href="https://ko-fi.com/L5F821TQO2"><img src="https://img.shields.io/badge/Ko--fi-support%20the%20work-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Support on Ko-fi"></a>
  </p>
</div>

This is my working fork of [PreMiD Activities](https://github.com/PreMiD/Activities). It keeps the upstream Activity library available while giving personal presences, prototypes, and site-specific experiments a home.

## Personal Work

- [StreamEast](websites/S/StreamEast) - live sports matches, scores, leagues, and status
- Additional maintained or experimental presences live under [`websites/`](websites/)

Personal-only activities may remain here when a site is not appropriate for the public PreMiD Activity Library. Public-ready improvements can still be proposed upstream as focused pull requests.

## Development

Install dependencies with Node.js 20 or newer:

```bash
npm install
```

Build or validate an activity with the local CLI:

```bash
npx pmd build "StreamEast" --validate
npx pmd dev "StreamEast"
```

The activity source lives in `websites/<letter>/<service>/`. Metadata belongs in `metadata.json`, and the presence implementation belongs in `presence.ts`.

## Syncing Upstream

This fork tracks the official repository through the `upstream` remote:

```bash
git fetch upstream
git switch main
git merge upstream/main
git push origin main
```

Keep personal-only work in its own commits or branches so upstream synchronization stays straightforward and public pull requests remain focused.

## Links

- [Portfolio](https://hashking.dev)
- [GitHub](https://github.com/hashking710)
- [Private development Discord](https://discord.gg/J7QBvvwhab)
- [Ko-fi](https://ko-fi.com/L5F821TQO2)
- [Official PreMiD Activities](https://github.com/PreMiD/Activities)
- [PreMiD documentation](https://docs.premid.app/)

## Upstream Project

PreMiD Activities enhance Discord Rich Presence by showing what people are doing across the web. This fork retains the upstream project structure and tooling while serving as my personal development workspace.
