import type { Photo } from "#/lib/types/type";
import { useCallback, useState } from "react";
import JSZip from "jszip"

export function useDownload() {
    const [downloading, setDownloading] = useState(false)

    const handleBlobDownload = useCallback((blob: Blob, download: string) => {
        const objectUrl = URL.createObjectURL(blob)

        const anchor = document.createElement("a")
        anchor.href = objectUrl
        anchor.download = download
        document.body.appendChild(anchor)
        anchor.click()

        document.body.removeChild(anchor)

        setTimeout(() => { URL.revokeObjectURL(objectUrl) }, 10_000)
    }, [])

    const download = useCallback(async (id: string, url: string) => {
        if (downloading) return
        try {
            const res = await fetch(url)
            const blob = await res.blob()
            const ext = blob.type.split("/")[1] ?? "jpg"
            const filename = `photo-${id}.${ext}`

            handleBlobDownload(blob, filename)
        } catch (error) {
            throw new Error("Download failed!")
        } finally {
            setDownloading(false)
        }

    }, [downloading, handleBlobDownload])

    const downloadMultiple = useCallback(async (photos: Photo[]) => {
        if (downloading) return
        try {
            setDownloading(true)
            const zip = new JSZip()
            await Promise.all(photos.map(async (photo) => {
                const res = await fetch(photo.public_url)
                const blob = await res.blob()
                const ext = blob.type.split("/")[1] ?? "jpg"
                zip.file(`photo-${photo.id}.${ext}`, blob)
            }))

            const zipBlob = await zip.generateAsync({ type: "blob" })

            handleBlobDownload(zipBlob, "photos.zip")
        } catch (error) {
            throw new Error("Download failed!")
        } finally {
            setDownloading(false)
        }
    }, [downloading, handleBlobDownload])

    return { download, downloading, downloadMultiple }
}