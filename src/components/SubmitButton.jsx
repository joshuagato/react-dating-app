const SubmitButton = ({ loading, children }) => {
  return (
    <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm 
            font-medium text-white bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 
            hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 
            disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed fade-in"
    >
        {loading
            && <div className="flex items-center gap-2 fade-in">
                <span className="loading loading-spinner" /><span>Loading</span></div>}
            {children}
    </button>
  )
}

export default SubmitButton;
