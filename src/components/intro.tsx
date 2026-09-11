const Intro = () => {
  return (
    <section className="animate-fadeIn animate-delay-100">
      <div className="container mx-auto py-8 2xl:max-w-[1400px]">
        {/* Title */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Free & Open Source Image Compressor
          </h1>
        </div>
        {/* End Title */}
        <div className="mx-auto mt-4 max-w-3xl text-center">
          <p className="text-muted-foreground text-lg !leading-6">
            Compress images instantly and securely—right on your device. No
            uploads, no limits, no APIs. Works offline and keeps your files
            private.
          </p>
        </div>
        {/* Buttons */}
        {/* <div className="mt-4 flex justify-center">
          <a
            href="https://www.producthunt.com/posts/image-compressor-4?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-image-compressor-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=866606&theme=light"
              alt="Image Compressor - Compress images fast, securely, and for free—no API call | Product Hunt"
              style={{ width: "187.5px", height: "40.5px" }}
            />
          </a>
        </div> */}
      </div>
    </section>
  );
};

export default Intro;
