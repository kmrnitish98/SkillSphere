const Loader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin"></div>
      <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
    </div>
  </div>
);

export default Loader;
