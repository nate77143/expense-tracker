<template>
  <div class="auth-layout">
    <section class="auth-card panel panel-strong">
      <div class="panel-header auth-header">
        <div>
          <p class="eyebrow">Secure Access</p>
          <h1 class="auth-title">{{ isSignUpMode ? 'Create your account' : 'Sign in' }}</h1>
          <p class="panel-copy">
            {{ isSignUpMode ? 'Start with a secure account for this expense tracker. Please contact administrator after signing up so your account can be approved.' : 'Sign in to continue to your workspace.' }}
          </p>
        </div>
        <span class="tag">{{ isSignUpMode ? 'Sign up' : 'Sign in' }}</span>
      </div>

      <div class="segmented auth-segmented" role="tablist" aria-label="Authentication mode">
        <button
          class="segment-button"
          :class="{ active: !isSignUpMode }"
          type="button"
          @click="switchMode(false)"
        >
          Sign in
        </button>
        <button
          class="segment-button"
          :class="{ active: isSignUpMode }"
          type="button"
          @click="switchMode(true)"
        >
          Sign up
        </button>
      </div>

      <form class="form-shell" @submit.prevent="submitAuth">
        <template v-if="isSignUpMode">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="auth-first-name">First name</label>
              <input
                id="auth-first-name"
                v-model.trim="form.firstName"
                type="text"
                class="form-input"
                placeholder="First name"
                autocomplete="given-name"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="auth-last-name">Last name</label>
              <input
                id="auth-last-name"
                v-model.trim="form.lastName"
                type="text"
                class="form-input"
                placeholder="Last name"
                autocomplete="family-name"
                required
              />
            </div>
          </div>
        </template>

        <div class="form-group">
          <label class="form-label" for="auth-email">Email</label>
          <input
            id="auth-email"
            v-model.trim="form.email"
            type="email"
            class="form-input"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="auth-password">Password</label>
          <input
            id="auth-password"
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="At least 6 characters"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="isSignUpMode" class="form-group">
          <label class="form-label" for="auth-confirm-password">Confirm password</label>
          <input
            id="auth-confirm-password"
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            placeholder="Re-enter your password"
            autocomplete="new-password"
            required
          />
        </div>

        <div v-if="isSignUpMode" class="status-banner">
          Please contact administrator after sign up. New accounts stay pending until an admin approves access.
        </div>

        <div v-if="statusMessage" class="status-banner" :class="statusToneClass">
          {{ statusMessage }}
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
          {{ submitting ? (isSignUpMode ? 'Creating account...' : 'Signing in...') : (isSignUpMode ? 'Create account' : 'Sign in') }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { signInWithEmail, signUpWithEmail } from '../services/supabaseAuthService'

const isSignUpMode = ref(false)
const submitting = ref(false)
const statusMessage = ref('')
const statusTone = ref<'default' | 'warning'>('default')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const statusToneClass = computed(() => {
  return statusTone.value === 'warning' ? 'status-banner-warning' : ''
})

const switchMode = (signUpMode: boolean) => {
  isSignUpMode.value = signUpMode
  statusMessage.value = ''
  statusTone.value = 'default'
  form.firstName = ''
  form.lastName = ''
  form.password = ''
  form.confirmPassword = ''
}

const submitAuth = async () => {
  if (!form.email || !form.password) {
    statusMessage.value = 'Please enter both email and password.'
    statusTone.value = 'warning'
    return
  }

  if (isSignUpMode.value) {
    if (!form.firstName || !form.lastName) {
      statusMessage.value = 'Please enter your first and last name.'
      statusTone.value = 'warning'
      return
    }

    if (form.password.length < 6) {
      statusMessage.value = 'Use a password with at least 6 characters.'
      statusTone.value = 'warning'
      return
    }

    if (form.password !== form.confirmPassword) {
      statusMessage.value = 'Password confirmation does not match.'
      statusTone.value = 'warning'
      return
    }
  }

  submitting.value = true
  statusMessage.value = ''

  try {
    if (isSignUpMode.value) {
      const { session, error } = await signUpWithEmail(form.email, form.password, {
        firstName: form.firstName,
        lastName: form.lastName
      })

      if (error) {
        throw error
      }

      statusMessage.value = session
        ? 'Account created. Your sign-in is pending admin approval. Please contact administrator.'
        : 'Account created. Check your email if confirmation is required, then contact administrator for approval.'
      statusTone.value = 'default'
      return
    }

    const { error } = await signInWithEmail(form.email, form.password)

    if (error) {
      throw error
    }

    statusMessage.value = 'Signed in successfully.'
    statusTone.value = 'default'
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'Authentication failed.'
    statusTone.value = 'warning'
  } finally {
    submitting.value = false
  }
}
</script>
