import { Show, createEffect, createSignal } from "solid-js";

type Section = "products" | "blog" | "company" | "legal";

export const NavAccordion = () => {
  const [shouldBeAccordion, setShouldBeAccordion] = createSignal(false);
  const [activeSection, setActiveSection] = createSignal<Section>("products");

  createEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    // Annotate e with MediaQueryListEvent which is part of the DOM typings
    const handleResize = (e: MediaQueryListEvent) => {
      setShouldBeAccordion(e.matches);
    };

    // Check the initial state by directly using the matches property
    setShouldBeAccordion(mediaQuery.matches);

    // Add listener for changes
    mediaQuery.addEventListener("change", handleResize);

    // Clean up by removing the event listener
    return () => mediaQuery.removeEventListener("change", handleResize);
  });

  return (
    <div class="grid md:grid-cols-[1fr,1fr,1fr,1fr] gap-4">
      <div class="grid gap-2 content-start items-start">
        <button
          class="text-left"
          onClick={(e) => {
            e.stopPropagation();
            setActiveSection("products");
          }}
        >
          Products & Services
        </button>
        <Show when={!shouldBeAccordion() || activeSection() === "products"}>
          <ul class="text-[#D9D9D9] grid gap-2 content-start items-start">
            <li>
              <a href="https://devtools.crabnebula.dev">DevTools</a>
            </li>
            <li>
              <a href="https://crabnebula.dev/security-auditing">
                Security Auditing
              </a>
            </li>
            <li>
              <a href="https://crabnebula.dev/consulting">Consultation</a>
            </li>
            <li>
              <a href="https://crabnebula.dev/distribution">Distribution</a>
            </li>
          </ul>
        </Show>
      </div>
      <div>
        <h3>
          <a href="https://crabnebula.dev/blog">Blog</a>
        </h3>
      </div>
      <div class="grid gap-2 content-start items-start">
        <button
          class="text-left"
          onClick={(e) => {
            e.stopPropagation();
            setActiveSection("company");
          }}
        >
          Company
        </button>
        <Show when={!shouldBeAccordion() || activeSection() === "company"}>
          <ul class="text-[#D9D9D9] grid gap-2 content-start items-start">
            <li>
              <a href="https://crabnebula.dev/about">About</a>
            </li>
            <li>
              <a href="https://crabnebula.dev/blog">Blog</a>
            </li>
            {/* <li>
              <a href="#">Case Studies</a>
            </li> */}
            {/* <li>
              <a href="#">Partners</a>
            </li> */}
            <li>
              <a href="https://crabnebula.dev/careers">Careers</a>
            </li>
          </ul>
        </Show>
      </div>
      <div class="grid gap-2 content-start items-start">
        <button
          class="text-left"
          onClick={(e) => {
            e.stopPropagation();
            setActiveSection("legal");
          }}
        >
          Legal
        </button>
        <Show when={!shouldBeAccordion() || activeSection() === "legal"}>
          <ul class="text-[#D9D9D9] grid gap-2 content-start items-start">
            <li>
              <a href="https://crabnebula.dev/privacy-policy">Privacy Policy</a>
            </li>
            <li>
              <a href="https://crabnebula.dev/cookie-policy">Cookie Policy</a>
            </li>
            <li>
              <a href="https://crabnebula.dev/terms-of-service">
                Terms of Service
              </a>
            </li>
          </ul>
        </Show>
      </div>
    </div>
  );
};