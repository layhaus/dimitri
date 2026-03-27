import { ref } from 'vue'
import pb from '../pb'
import type { RecordModel } from 'pocketbase'

export function useInquiries() {
  const inquiries = ref<RecordModel[]>([])
  const loading = ref(false)

  async function loadMyInquiries() {
    loading.value = true
    try {
      const result = await pb.collection('inquiries').getList(1, 100, {
        sort: '-created',
        expand: 'user',
        requestKey: null,
      })
      inquiries.value = result.items
    } finally {
      loading.value = false
    }
  }

  async function loadAllInquiries(statusFilter?: string) {
    loading.value = true
    try {
      const options: Record<string, unknown> = {
        sort: '-created',
        expand: 'user',
        requestKey: null,
      }
      if (statusFilter && statusFilter !== 'all') {
        options.filter = pb.filter('status = {:status}', { status: statusFilter })
      }
      const result = await pb.collection('inquiries').getList(1, 100, options)
      inquiries.value = result.items
    } finally {
      loading.value = false
    }
  }

  async function getInquiry(id: string): Promise<RecordModel> {
    return await pb.collection('inquiries').getOne(id, {
      expand: 'user',
      requestKey: null,
    })
  }

  async function createInquiry(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', file.name)
    formData.append('user', pb.authStore.record!.id)
    formData.append('status', 'pending')
    return await pb.collection('inquiries').create(formData)
  }

  async function updateInquiry(id: string, status: string, notes: string) {
    return await pb.collection('inquiries').update(id, { status, notes })
  }

  async function deleteInquiry(id: string) {
    return await pb.collection('inquiries').delete(id)
  }

  function getFileUrl(record: RecordModel): string {
    return pb.files.getURL(record, record.file)
  }

  return {
    inquiries,
    loading,
    loadMyInquiries,
    loadAllInquiries,
    getInquiry,
    createInquiry,
    updateInquiry,
    deleteInquiry,
    getFileUrl,
  }
}
