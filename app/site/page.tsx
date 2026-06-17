export default function SitePage() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.href = '/index-marketing.html'`
      }}
    />
  )
}
