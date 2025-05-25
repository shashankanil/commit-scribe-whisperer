
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  github_username: string | null;
  avatar_url: string | null;
}

interface AuthButtonProps {
  onAuthChange: (user: any, profile: Profile | null) => void;
}

const AuthButton = ({ onAuthChange }: AuthButtonProps) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        onAuthChange(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    onAuthChange(user, profile);
  }, [user, profile, onAuthChange]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signInWithGitHub = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'read:user user:email repo',
          redirectTo: window.location.origin
        }
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to authenticate with GitHub",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (user && profile) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Connected Account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                <Github className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium">
                {profile.github_username || 'GitHub User'}
              </p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-200 hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Github className="h-5 w-5" />
          Connect GitHub Account
        </CardTitle>
        <CardDescription className="text-gray-400">
          Connect your GitHub account to access your repositories and commits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={signInWithGitHub}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Github className="h-4 w-4 mr-2" />
          {loading ? "Connecting..." : "Connect with GitHub"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthButton;
