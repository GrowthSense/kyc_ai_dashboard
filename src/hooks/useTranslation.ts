import { useSettingsStore } from '@/stores/settingsStore';
import { getTranslations, TranslationKey } from '@/i18n/translations';

export function useTranslation() {
  const language = useSettingsStore((s) => s.preferences.display.language);
  const dict = getTranslations(language);
  const t = (key: TranslationKey): string => dict[key] ?? key;
  return { t, language };
}
