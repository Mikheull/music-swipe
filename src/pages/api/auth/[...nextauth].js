import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'


export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: "https://accounts.spotify.com/authorize?scope=user-library-read,playlist-modify-private,playlist-modify-public"
    }),

    {
      id: "deezer",
      name: "Deezer",
      type: "oauth",
      authorization: {
        url: "https://connect.deezer.com/oauth/auth.php",
        urll:  `https://connect.deezer.com/oauth/auth.php?${new URLSearchParams({
          perms: "basic_access,manage_community,manage_library,offline_access",
        })}`,
        params: { perms: "basic_access,manage_community,manage_library,offline_access" },
      },
      token: {
        async request({ provider, params }) {
          const res = await fetch(
            `https://connect.deezer.com/oauth/access_token.php?${new URLSearchParams({
              app_id: provider.clientId,
              secret: provider.clientSecret,
              code: params.code,
            })}`
          )
          const data = new URLSearchParams(await res.text())
    
          return {
            tokens: {
              access_token: data.get("access_token"),
              expires_at: Math.ceil(Date.now() / 1000 + +data.get("expires")),
            },
          }
        },
      },
      clientId: process.env.DEEZER_ID,
      clientSecret: process.env.DEEZER_SECRET,
      userinfo: {
        url: "https://api.deezer.com/user/me",
        request({ tokens, client }) {
          const { access_token } = tokens
          return client.userinfo(access_token, { params: { access_token } })
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
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