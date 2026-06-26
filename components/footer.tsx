"use client";

import { ChangelogDialog } from "@/components/changelog-dialog";

export function Footer() {
  return (
    <section>
      <div className="max-w-screen-xl px-4 py-12 mx-auto space-y-8 overflow-hidden sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-2 pb-4">
          <ChangelogDialog currentAppVersion={process.env.NEXT_PUBLIC_APP_VERSION} />
        </div>
        <div className="max-w-2xl mx-auto text-center px-4 pb-4">
          <p className="text-xs text-muted-foreground/60 italic">
            FFCS MATE is an independent student-built tool and is not officially affiliated with, endorsed by, or connected to VIT-AP University.
          </p>
        </div>
        <p className="text-base leading-6 text-center text-gray-400">
          Made with ❤️ for VITAPians <br />
          by <a href="https://github.com/sabarishwaran-v" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:underline transition-colors duration-200 font-medium">Sabarish v</a> <br />
          Copyright &copy; {new Date().getFullYear()} FFCS MATE. All rights
          reserved.
        </p>
      </div>
    </section>
  );
}
