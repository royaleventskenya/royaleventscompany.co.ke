<script>
    let slides = document.querySelectorAll(".slide");
    let index = 0;

    function showNextSlide() {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    }

    setInterval(showNextSlide, 4000);
  </script>
  <!-- Lightbox2 JS -->
<script src="https://cdn.jsdelivr.net/npm/lightbox2@2.11.4/dist/js/lightbox.min.js"></script>
<script>
  function toggleMenu() {
    document.getElementById("navLinks").classList.toggle("active");
  }
</script>
