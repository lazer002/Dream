import { useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function AuthCallback() {
  const { setUser, setAccessToken } = useAuth(); // if your context exposes setters
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Get the session after redirect
      const { data: { session }, error } = await supabase.auth.getSession();

      console.log('Session:', session, 'Error:', error);

      if (error) {
        console.error(error);
        navigate('/login');
        return;
      }

      if (session?.user) {
        // Save session to context / localStorage
        const supaUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email,
          provider: session.user.app_metadata?.provider,
        };
        setUser?.(supaUser);
        setAccessToken?.(session.access_token);
        localStorage.setItem('ds_user', JSON.stringify(supaUser));
        localStorage.setItem('ds_access', session.access_token);

        navigate('/'); // redirect to home
      } else {
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate, setUser, setAccessToken]);

  return null; // nothing to render
}
 