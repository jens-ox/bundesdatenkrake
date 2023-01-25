import axios from 'axios'
import Papa from 'papaparse'
import { Exporter } from '../../types'
import { germanDateToString } from '../../utils/germanDateToString'
import type { Ladesaeule, Stecker } from './types'

const removeEmptyFields = (something: any) =>
  Object.fromEntries(Object.entries(something).filter(([, v]) => typeof v !== 'undefined' && v !== '' && v !== null))

const createStecker = (typ: string, kW: string, publicKey: string): Stecker => ({
  steckertypen: typ,
  kW: kW !== '' ? parseInt(kW) : undefined,
  publicKey
})

export const LadesaeulenExporter: Exporter<Array<Ladesaeule>> = async () => {
  const { data: rawData } = await axios.get(
    'https://www.bundesnetzagentur.de/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/E_Mobilitaet/Ladesaeulenregister_CSV.csv?__blob=publicationFile',
    { insecureHTTPParser: true, responseEncoding: 'latin1' }
  )
  const data: Array<Ladesaeule> = Papa.parse<Array<string>>(rawData)
    .data.map((e) => ({
      betreiber: e[0],
      strasse: e[1],
      hausnummer: e[2],
      addresszusatz: e[3],
      plz: e[4],
      ort: e[5],
      bundesland: e[6],
      kreis: e[7],
      lat: e[8],
      lon: e[9],
      datumInbetriebnahme: germanDateToString(e[10]) ?? '',
      anschlussleistung: e[11] !== '' ? parseInt(e[11]) : '',
      artLadeeinrichtung: e[12],
      anzahlLadepunkte: e[13] !== '' ? parseInt(e[13]) : '',
      stecker: [
        createStecker(e[14], e[15], e[16]),
        createStecker(e[17], e[18], e[19]),
        createStecker(e[20], e[21], e[22]),
        createStecker(e[23], e[24], e[25])
      ]
    }))
    // clean up empty fields
    .map(
      (e) =>
        ({
          ...removeEmptyFields(e),
          stecker: e.stecker.map((s) => removeEmptyFields(s) as Stecker).filter((s) => Object.keys(s).length > 0)
        } as Ladesaeule)
    )
    // filter out stations without actual cables and the header
    .filter((e) => e.stecker.length > 0 && !['Steckertypen1', '1. Ladepunkt'].includes(e.stecker[0].steckertypen))

  console.log(JSON.stringify(data.slice(0, 15)))
  return [
    {
      targetFile: 'main.json',
      data
    }
  ]
}
