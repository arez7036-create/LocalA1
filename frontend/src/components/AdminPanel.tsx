import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { UserRead } from '../types'
import { Shield, Users, Trash2, X, Check, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface AdminUser extends UserRead {
  rate_limit: number
  rate_window: number
}

interface AdminStats {
  total_users: number
  total_messages: number
  messages_today: number
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats>({ total_users: 0, total_messages: 0, messages_today: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const toggleAdmin = async (user: AdminUser) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { is_superuser: !user.is_superuser })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_superuser: !u.is_superuser } : u))
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }

  const toggleActive = async (user: AdminUser) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }

  const deleteUser = async (id: number) => {
    if (!confirm('Удалить пользователя? Это действие нельзя отменить.')) return
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-green-600" />
        Панель администратора
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Всего пользователей</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Всего сообщений</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total_messages}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Сообщений сегодня</p>
          <p className="text-3xl font-bold text-gray-900">{stats.messages_today}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Лимиты</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Создан</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">{user.email.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        user.is_superuser ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      )}>
                        {user.is_superuser ? 'Админ' : 'Пользователь'}
                      </span>
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{user.rate_limit === 0 ? '∞' : `${user.rate_limit} req`}</span>
                      <span>/ {Math.round(user.rate_window / 60)} мин</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleAdmin(user)}
                        className={cn('p-2 rounded-lg transition-colors', user.is_superuser ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                        title={user.is_superuser ? 'Снять админку' : 'Сделать админом'}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        className={cn('p-2 rounded-lg transition-colors', user.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}
                        title={user.is_active ? 'Заблокировать' : 'Разблокировать'}
                      >
                        {user.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Пользователей нет</p>
          </div>
        )}
      </div>
    </div>
  )
}
