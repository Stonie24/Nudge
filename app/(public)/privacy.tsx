import { LegalPage } from '../../components/LegalPage'
import { privacyPolicyMarkdown } from '../../lib/legal/content.generated'

export default function PrivacyScreen() {
  return <LegalPage markdown={privacyPolicyMarkdown} />
}
