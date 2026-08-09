import { createApp } from '@/core'
import { authRoute } from './auth'
import { userRoute } from './user'
import { adminRoute } from './admin'
import { trackRoute } from './track'
import { exportRoute } from './exports'

export const api = createApp()

api.route('/auth', authRoute)
api.route('/user', userRoute)
api.route('/admin', adminRoute)
api.route('/track', trackRoute)
api.route('/exports', exportRoute)

