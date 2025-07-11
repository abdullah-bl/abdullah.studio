import { ThemeSwitcher } from "./theme-switcher"

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="mb-16">

      {/* <ul className="font-sm mt-8 flex items-center gap-4 space-y-2 text-neutral-600 dark:text-neutral-300 flex-wrap">

        <li>
          <a href="mailto:abdullah@abdullah.studio" className="hover:underline flex items-center gap-1" target="_blank" rel="noopener noreferrer">
            &#x1F4E7;
            Contact me
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/abdullahbl"
          >
            &#x1F4BB;
            GitHub
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/abdullah-bl/abdullah.studio"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">view source</p>
          </a>
        </li>
      </ul> */}
      <div className="flex items-center gap-4 justify-center mt-4">
        <ThemeSwitcher />
        <p className="text-neutral-600 dark:text-neutral-300">
          © {new Date().getFullYear()} Abdullah Bl
        </p>
        <a
          className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
          rel="noopener noreferrer"
          target="_blank"
          href="https://github.com/abdullah-bl/abdullah.studio"
        >
          <ArrowIcon />
          <p className="ml-2 h-7">view source</p>
        </a>
      </div>
    </footer>
  )
}
