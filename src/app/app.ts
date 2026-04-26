import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

const versionFormat = /^\d+\.\d+\.\d+$/;

function isValidVersionComponent(value: string): boolean {
  return value === '0' ? true : /^[1-9]\d*$/.test(value);
}

function buildGreaterNumberPattern(value: string): string {
  if (value === '0') {
    return '[1-9][0-9]*';
  }

  const digits = value.split('');
  const length = digits.length;
  const branches: string[] = [];

  for (let i = 0; i < length; i += 1) {
    const current = Number(digits[i]);
    if (current < 9) {
      const prefix = digits.slice(0, i).join('');
      const suffixLength = length - i - 1;
      const suffix = suffixLength > 0 ? `[0-9]{${suffixLength}}` : '';
      branches.push(`${prefix}[${current + 1}-9]${suffix}`);
    }
  }

  branches.push('[1-9][0-9]{' + length + ',}');
  return branches.join('|');
}

function buildRegexForVersion(version: string): string {
  if (!versionFormat.test(version)) {
    return '';
  }

  const [major, minor, patch] = version.split('.');
  if (!isValidVersionComponent(major) || !isValidVersionComponent(minor) || !isValidVersionComponent(patch)) {
    return '';
  }

  const majorGt = `(?:${buildGreaterNumberPattern(major)})`;
  const minorGt = `(?:${buildGreaterNumberPattern(minor)})`;
  const patchGt = `(?:${buildGreaterNumberPattern(patch)})`;

  return `(?:${majorGt}\\.[0-9]+\\.[0-9]+|${major}\\.${minorGt}\\.[0-9]+|${major}\\.${minor}\\.${patchGt}|${major}\\.${minor}\\.${patch})`;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  host: {
    'class': 'theme-dark'
  },
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly version = signal('');
  protected readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly validVersion = computed(() => versionFormat.test(this.version()));

  protected readonly regex = computed(() => {
    const value = this.version();
    return this.validVersion() ? buildRegexForVersion(value) : '';
  });

  protected readonly escapedRegex = computed(() => {
    const value = this.regex();
    return value ? value.replace(/\\/g, '\\\\') : '';
  });

  protected setVersion(value: string) {
    this.version.set(value.trim());
  }

  protected async copyRegex() {
    const value = this.escapedRegex();
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    this.copied.set(true);
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }
    this.copyTimer = setTimeout(() => {
      this.copied.set(false);
      this.copyTimer = undefined;
    }, 1800);
  }

  protected async testRegex() {
    const value = this.regex();
    if (!value) {
      return;
    }

    window.open(`https://regex101.com/?regex=${encodeURIComponent(value)}&flavor=javascript`, '_blank');
  }
}
