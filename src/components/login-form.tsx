"use client";

import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || 'Login failed');
      }
      router.replace('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2 w-full max-w-4xl", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg w-full">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-4 md:p-5 w-full" onSubmit={onSubmit}>
            <FieldGroup className="space-y-0">
              <div className="flex flex-col items-center text-center mb-1">
                <img 
                  src="/login/UPSHIFT logo.png" 
                  alt="UPSHIFT Bhutan" 
                  className="h-12 mb-2"
                />
                <h1 className="text-2xl font-bold text-[#1A1A1A] ">LOGIN</h1>
                <p className="text-[#6B6B6B] text-balance text-xs">
                  How to | get started lorem ipsum dolor at?
                </p>
              </div>
              
              {error && <p className="text-sm text-red-600 text-center mb-2">{error}</p>}
              
              <div className="space-y-2 mb-2">
                <div className="flex items-center bg-[#f2f0fa] rounded-full px-5 py-3 w-full max-w-[340px] mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                  <input
                    id="username"
                    type="text"
                    placeholder="Username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-transparent border-none w-full focus:outline-none focus:ring-0 placeholder-black text-sm px-1"
                  />
                </div>
                
                <div className="flex items-center bg-[#f2f0fa] rounded-full px-5 py-3 w-full max-w-[340px] mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input 
                    id="password" 
                    type="password" 
                    placeholder="Password"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border-none w-full focus:outline-none focus:ring-0 placeholder-black text-sm px-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-center mb-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#FF9A02] hover:bg-[#e68a00] text-white font-medium py-2.5 px-8 rounded-full text-center shadow-md hover:shadow-lg transition-shadow text-sm disabled:opacity-50 w-full max-w-[200px]"
                >
                  {loading ? 'Login...' : 'Login Now'}
                </button>
              </div>
              
              <div className="flex items-center justify-center mb-1.5">
                <div className="bg-gray-300 h-px flex-grow max-w-[80px]"></div>
                <p className="text-xs text-black-600 px-3"><span className="font-bold">Login</span> with Others</p>
                <div className="bg-gray-300 h-px flex-grow max-w-[80px]"></div>
              </div>
              
              <div className="flex justify-center">
                <button 
                  type="button" 
                  className="w-full max-w-[280px] mx-auto border border-gray-300 rounded-full py-2.5 px-5 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="flex-shrink-0">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm">Login with google</span>
                </button>
              </div>
            </FieldGroup>
          </form>
          <div className="bg-purple-500 relative hidden md:block">
            <img
              src="/login/login.png"
              alt="Login"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
