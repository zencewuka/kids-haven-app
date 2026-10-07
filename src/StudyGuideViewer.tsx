import { useEffect, useRef, useState } from "react"
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export const STUDY_GUIDE_URL = `${import.meta.env.BASE_URL}study-guide.pdf`

function PdfPage({
  document,
  pageNumber,
  width,
}: {
  document: PDFDocumentProxy
  pageNumber: number
  width: number
}) {
  const pageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pageElement = pageRef.current
    if (!pageElement) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: "800px 0px" },
    )
    observer.observe(pageElement)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context || width <= 0 || !isNearViewport) return

    let cancelled = false
    let renderTask: ReturnType<PDFPageProxy["render"]> | null = null

    const renderPage = async () => {
      try {
        const page = await document.getPage(pageNumber)
        if (cancelled) return

        const baseViewport = page.getViewport({ scale: 1 })
        const scale = width / baseViewport.width
        const viewport = page.getViewport({ scale })
        const outputScale = Math.min(window.devicePixelRatio || 1, 2)

        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform:
            outputScale === 1
              ? undefined
              : [outputScale, 0, 0, outputScale, 0, 0],
        })
        await renderTask.promise
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not render this page.",
          )
        }
      }
    }

    setError(null)
    void renderPage()

    return () => {
      cancelled = true
      renderTask?.cancel()
      canvas.width = 0
      canvas.height = 0
      canvas.style.height = "auto"
    }
  }, [document, pageNumber, width, isNearViewport])

  return (
    <div ref={pageRef} style={{ marginBottom: 16 }}>
      <canvas
        ref={canvasRef}
        aria-label={`Study guide page ${pageNumber}`}
        style={{
          display: "block",
          maxWidth: "100%",
          width: "100%",
          height: "auto",
          aspectRatio: "0.75",
          margin: "0 auto",
          background: "white",
          borderRadius: 4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        }}
      />
      {error && (
        <div role="alert" style={{ color: "#fecaca", padding: 12 }}>
          Page {pageNumber}: {error}
        </div>
      )}
    </div>
  )
}

export default function StudyGuideViewer({
  onClose,
}: {
  onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [width, setWidth] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadingTask = getDocument({ url: STUDY_GUIDE_URL })

    const loadDocument = async () => {
      try {
        const pdf = await loadingTask.promise
        if (!cancelled) {
          setDocument(pdf)
          setPageCount(pdf.numPages)
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not open the study guide.",
          )
        }
      }
    }

    void loadDocument()

    return () => {
      cancelled = true
      void loadingTask.destroy()
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(0, entry.contentRect.width - 24))
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Study guide"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        background: "#14245a",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: "#1a2f5e",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close study guide"
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            fontWeight: 800,
          }}
        >
          ← Close
        </button>
        <div style={{ flex: 1, fontWeight: 900, fontFamily: "Outfit, sans-serif" }}>
          Study Guide
        </div>
        {pageCount > 0 && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {pageCount} pages
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          paddingBottom: 32,
        }}
      >
        {!document && !error && (
          <div role="status" style={{ textAlign: "center", padding: 32 }}>
            Opening study guide…
          </div>
        )}
        {error && (
          <div role="alert" style={{ color: "#fecaca", padding: 16 }}>
            Could not open the study guide: {error}
          </div>
        )}
        {document &&
          Array.from({ length: pageCount }, (_, index) => (
            <PdfPage
              key={index + 1}
              document={document}
              pageNumber={index + 1}
              width={width}
            />
          ))}
      </div>
    </div>
  )
}
