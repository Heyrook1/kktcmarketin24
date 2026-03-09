"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface ReviewUser {
  isLoggedIn: boolean
  isLoading: boolean
  fullName: string
  nameFromProfile: boolean
  nameMissing: boolean
  userId: string | null
}

export function useReviewUser(): ReviewUser {
  const [state, setState] = useState<ReviewUser>({
    isLoggedIn: false,
    isLoading: true,
    fullName: "",
    nameFromProfile: false,
    nameMissing: false,
    userId: null,
  })

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setState({ isLoggedIn: false, isLoading: false, fullName: "", nameFromProfile: false, nameMissing: false, userId: null })
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()

      const fullName = (profile?.full_name as string | null)?.trim() ?? ""

      setState({
        isLoggedIn: true,
        isLoading: false,
        fullName,
        nameFromProfile: fullName.length > 0,
        nameMissing: fullName.length === 0,
        userId: user.id,
      })
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { load() })
    return () => subscription.unsubscribe()
  }, [])

  return state
}
