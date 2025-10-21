export default function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-text-secondary">Подготовка на поръчката...</p>
      </div>
    </div>
  )
}



