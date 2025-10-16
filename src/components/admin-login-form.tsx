"use client";

import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export function AdminLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const handleRoleLogin = (role: string) => {
    // Static for now - will implement Google OAuth later
    console.log('Admin login with role:', role);
    // router.replace('/dashboard');
  }

  return (
    <div className={cn("flex flex-col gap-2 w-full max-w-4xl", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg w-full">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-4 md:p-10 w-full min-h-[500px] flex flex-col justify-center">
            <div className="flex flex-col items-center text-center mb-6">
              <Image 
                src="/login/UPSHIFT logo.png" 
                alt="UPSHIFT Bhutan" 
                width={48}
                height={48}
                className="h-12 mb-2"
              />
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">ADMIN LOGIN</h1>
              <p className="text-[#6B6B6B] text-balance text-xs">
                Select your admin role to continue
              </p>
            </div>

            {!showRoleSelection ? (
              // Initial screen: Single Google login button
              <div className="space-y-4">
                <button 
                  onClick={() => setShowRoleSelection(true)}
                  className="w-full max-w-[340px] mx-auto bg-white border border-gray-300 rounded-full py-2.5 px-5 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
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
            ) : (
              // After clicking Google button - Show District Admin & Super Admin options
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">Select Admin Role</h2>
                  <button
                    onClick={() => setShowRoleSelection(false)}
                    className="text-xs text-gray-600 hover:text-gray-800 underline"
                  >
                    Back
                  </button>
                </div>

                {/* District Admin Google Button */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-left text-gray-600">DISTRICT ADMIN</p>
                  <button 
                    onClick={() => handleRoleLogin('districtadmin')}
                    className="w-full max-w-[340px] mx-auto bg-white border border-gray-300 rounded-full py-2.5 px-5 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
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

                {/* Super Admin Google Button */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-left text-gray-600">SUPER ADMIN</p>
                  <button 
                    onClick={() => handleRoleLogin('superadmin')}
                    className="w-full max-w-[340px] mx-auto bg-white border border-gray-300 rounded-full py-2.5 px-5 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
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
              </div>
            )}
          </div>
          <div className="bg-purple-500 relative hidden md:block">
            <Image
              src="/login/login.png"
              alt="Login"
              fill
              className="object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
