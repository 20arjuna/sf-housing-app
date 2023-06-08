import { supabase } from "../supabaseClient";

export async function getCurrentUser() {
  // Returns most pertinent data from active session
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error(error);
  } else if (data?.session?.user?.user_metadata) {
    const { user_metadata: meta } = data.session.user;

    const signedInUserData = {
      accessToken: data.session.access_token,
      userID: data.session.user.id,
      twitterAvatarURL: meta.avatar_url,
      twitterEmail: meta.email,
      twitterName: meta.full_name,
      twitterHandle: meta.preferred_username,
      twitterID: meta.provider_id,
    };

    console.log(signedInUserData);

    return signedInUserData;
  }
}

export async function signInWithTwitter() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "twitter",
  });
}

async function signOut() {
  await supabase.auth.signOut();
  // trigger router.refresh() from calling component
}
