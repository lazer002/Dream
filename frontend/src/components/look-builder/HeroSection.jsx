export default function HeroSection() {
  return (
    <section className="relative h-[75vh] overflow-hidden">

      <img
        src="/images/look-builder-hero.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/55" />

      <div className="relative h-full flex items-center justify-center">

        <div className="text-center text-white px-6">

          <p className="uppercase tracking-[0.5em] text-sm mb-5">
            Personal Styling
          </p>

          <h1 className="text-5xl md:text-7xl xl:text-8xl font-black tracking-tight">
            BUILD YOUR LOOK
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-lg text-white/80">
            Create your own outfit and unlock
            exclusive bundle savings.
          </p>
        </div>
      </div>
    </section>
  );
}