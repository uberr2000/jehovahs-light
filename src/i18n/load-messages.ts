import type { Locale } from './config';

export async function loadMessages(locale: Locale) {
  switch (locale) {
    case 'zh-TW':
      return (await import('./messages/zh-TW.json')).default;
    case 'zh-CN':
      return (await import('./messages/zh-CN.json')).default;
    case 'es':
      return (await import('./messages/es.json')).default;
    case 'pt':
      return (await import('./messages/pt.json')).default;
    case 'fr':
      return (await import('./messages/fr.json')).default;
    case 'de':
      return (await import('./messages/de.json')).default;
    case 'ja':
      return (await import('./messages/ja.json')).default;
    case 'ko':
      return (await import('./messages/ko.json')).default;
    case 'ru':
      return (await import('./messages/ru.json')).default;
    case 'ar':
      return (await import('./messages/ar.json')).default;
    case 'id':
      return (await import('./messages/id.json')).default;
    case 'th':
      return (await import('./messages/th.json')).default;
    case 'vi':
      return (await import('./messages/vi.json')).default;
    case 'en':
    default:
      return (await import('./messages/en.json')).default;
  }
}
