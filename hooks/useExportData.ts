import { useMutation } from '@tanstack/react-query'
import { fetchExport, deliverExport } from '../lib/exportData'

/** Fetches all of the user's data and hands it over as a JSON file / share sheet. */
export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const doc = await fetchExport()
      const outcome = await deliverExport(doc)
      return { doc, outcome }
    },
  })
}
