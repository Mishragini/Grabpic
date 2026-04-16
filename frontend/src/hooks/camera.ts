import { use, useCallback, useEffect, useRef, useState } from "react";

export function useCamera() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream>(null)

    const stop = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null
        }

    }, [])

    const start = useCallback(async () => {
        stop();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [stop])


    const capture = useCallback(() => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas")
        const video = videoRef.current

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext("2d")
        ctx?.drawImage(video, 0, 0)

        return canvas.toDataURL("image/png") ?? null
    }, [])


    useEffect(() => {
        return () => stop();
    }, [stop]);


    return {
        videoRef,
        start,
        stop,
        capture,
    };

}