import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'


export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: "https://accounts.spotify.com/authorize?scope=user-library-read,playlist-modify-private,playlist-modify-public"
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
        token.accountId = account.providerAccountId
      }
      return token
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken
      session.provider = token.provider
      session.accountId = token.accountId
      return session
    }
  },
  secret: process.env.SECRET,
})