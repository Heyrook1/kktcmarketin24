"use client"

import { useState } from "react"
import { Facebook, Twitter, Link2, Check, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ShareButtonsProps {
  url: string
  title: string
  description?: string
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || "")

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:text-green-600",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:text-sky-500",
    },
  ]

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {shareLinks.map((link) => (
          <Tooltip key={link.name}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={link.color}
                onClick={() => window.open(link.href, "_blank", "width=600,height=400")}
              >
                <link.icon className="h-4 w-4" />
                <span className="sr-only">Share on {link.name}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share on {link.name}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              <span className="sr-only">Copy link</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied!" : "Copy link"}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
