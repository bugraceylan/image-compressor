# The Compressor

Browser-only compressor for images, videos and the pictures inside Office/PDF files
(React, TypeScript, Vite). Nothing is uploaded; keep it that way.

## Checks

```bash
npm run lint
npm run build
```

## Releasing a version

A release is a commit on `master` that changes the version in `package.json`:
`.github/workflows/release.yml` then creates the `v<version>` tag, publishes the
Docker image and deploys GitHub Pages (https://bugraceylan.github.io/image-compressor/).
It runs only for pushes made as the repository owner, which includes this session's
pushes. Cloud sessions cannot push tags themselves (the git proxy returns 403), so
never ask the user to tag: bump the version and push to `master`.

On every release, when the change affects what the app does, update all of these
in the same release:

1. `package.json` / `package-lock.json` version (`npm version X.Y.Z --no-git-tag-version`;
   minor for a new feature, patch for fixes). The footer shows this version.
2. `README.md`: the intro sentence, Features list, and Stack line.
3. `index.html`: `description`, `og:description` and `keywords` meta tags.
4. In-app texts in `src/lib/i18n.ts` (English and Turkish): intro, drop zone,
   empty state, invalid-file toast.
5. The GitHub repository About section (description, website, topics). It is not
   in the repository and cannot be edited from Claude Code sessions: give the user
   the updated text below and ask them to paste it (repo page → gear icon next to
   About). Keep the text below in sync with what the About section should say.

After pushing, verify the deploy: the release workflow run succeeded, the tag
exists, and the live site's footer shows the new version. If the run was skipped or
must be repeated, the workflow can also be started by hand (workflow_dispatch).

### GitHub About text

- Description: Free, open-source image, video and document compressor that runs
  entirely in your browser: JPG, PNG, WebP, MP4, MOV, WebM, Word, Excel,
  PowerPoint and PDF. Nothing is uploaded.
- Website: https://bugraceylan.github.io/image-compressor/
- Topics: image-compression, video-compression, pdf-compression, docx, xlsx, pptx,
  webcodecs, react, typescript, vite, offline, privacy
