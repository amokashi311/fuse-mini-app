# Dare Challenge - Farcaster Mini App

A social dare challenge app built as a Farcaster Mini App. Users can complete daily dares, share their achievements, and see what others have accomplished.

## Features

- 24-hour timer for each dare
- Media upload support for dare completion proof
- Social feed of completed dares
- Integration with Farcaster for user authentication and social features

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Configuration

The app requires a few configuration steps:

1. Update the `.well-known/farcaster.json` file with your domain and image URLs
2. Set up a backend service to handle media uploads and user data storage
3. Configure Farcaster authentication

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Farcaster Frame SDK
- Vite

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT