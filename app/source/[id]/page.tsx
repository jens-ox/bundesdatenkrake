import { Source } from '@prisma/client'
import classNames from 'classnames'
import prisma from '../../../lib/prisma'
import { SerializedSnapshot } from '../../../types'
import { ebGaramond } from '../../../utils/fonts'
import SnapshotsTable from '../../../components/tables/Snapshots'

interface SourceData {
  source: Source | null
  snapshots: Array<SerializedSnapshot> | null
}

const getData = async (id: string): Promise<SourceData> => {
  const data = await prisma.source.findFirst({
    where: {
      id: `${id}`
    },
    include: {
      snapshots: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (data === null)
    return {
      source: null,
      snapshots: null
    }

  const { snapshots, ...source } = data

  return {
    source,
    snapshots: snapshots.map((s) => ({ ...s, createdAt: s.createdAt.toString() }))
  }
}

interface SourcePageProps {
  params: {
    id: string
  }
}

const SourcePage = async ({ params }: SourcePageProps) => {
  const { source, snapshots } = await getData(params.id ?? 'unknown')

  return (
    <div>
      {source === null ? (
        <p>Quelle nicht gefunden</p>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="flex flex-col">
            <h1 className={classNames(ebGaramond.className, 'font-medium text-5xl mb-2')}>{source.name}</h1>
            <small className="text-stone-500">
              {source.description} —{' '}
              <a href={source.url} className="underline" target="_blank">
                {source.office}
              </a>
            </small>
            <a href={`/schemas/${params.id}.json`}>
              <small className="text-indigo-600 underline">Schema herunterladen</small>
            </a>
          </div>

          {snapshots === null ? <p>Keine Snapshots gefunden</p> : <SnapshotsTable snapshots={snapshots} />}
        </div>
      )}
    </div>
  )
}

export default SourcePage
