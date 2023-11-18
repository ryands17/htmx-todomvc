# TODOMVC + HTMX

[![Build Status](https://github.com/ryands17/htmx-todomvc/actions/workflows/build.yaml/badge.svg)](https://github.com/ryands17/htmx-todomvc/actions/workflows/build.yaml)

This is a simple TODOMVC app made with [HTMX](https://htmx.org/) and Express as the backend.

## Prerequisites

- Node v18 (LTS) or above
- PNPM

## Steps

- Clone this repo
- Run `pnpm i`
- Use any one of the below commands

## Commands

- `pnpm app:dev` - Runs the app in development using Nodemon
- `pnpm app:build` - Builds the app using ESBuild for production
- `pnpm build` - Builds the SST app ready to be deployed
- `pnpm deploy` - Deploys the SST stack with this app to AWS (Uses Lambda and S3 + CloudFront)
- `pnpm destroy` - Destroys the deployed SST stack
- `pnpm lint` - Runs the TypeScript type checker and scans for XSS vulnerabilities
- `pnpm start` - Starts the app in production

## Things to do:

- [x] Deploy the app on AWS (via SST)
- [ ] Add a backend database for todos (preferably DynamoDB)
