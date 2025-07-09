"use client";

// import { STT } from '@/components/stt'
import { useEffect, useState } from 'react'

export default function STTPage() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return <div>Loading...</div>
    }

    return <div>STT</div>
}

