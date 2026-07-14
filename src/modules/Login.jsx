import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  const reset = () => { setErro(''); setMsg('') }

  const handleLogin = async () => {
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setLoading(true); reset()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro(traduzErro(error.message))
    setLoading(false)
  }

  const handleRecuperar = async () => {
    if (!email) { setErro('Informe seu e-mail.'); return }
    setLoading(true); reset()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) setErro(traduzErro(error.message))
    else setMsg('E-mail de recuperacao enviado. Verifique sua caixa de entrada.')
    setLoading(false)
  }

  const onEnter = e => {
    if (e.key !== 'Enter') return
    if (modo === 'login') handleLogin(); else handleRecuperar()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-[380px] max-w-[90vw] bg-gray-900 rounded-2xl p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-primary font-extrabold text-xl tracking-widest">SISTEMA FINANCEIRO</div>
          <div className="text-gray-500 text-xs mt-1">Gestao de Restaurante</div>
        </div>

        <div className="text-white font-bold text-lg mb-6 text-center">
          {modo === 'login' && 'Entrar na sua conta'}
          {modo === 'recuperar' && 'Recuperar senha'}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={onEnter}
            className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-950 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {modo !== 'recuperar' && (
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={onEnter}
              className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-950 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
        </div>

        {erro && (
          <div className="mt-3 px-4 py-3 rounded-lg bg-red-950 border border-red-900 text-red-400 text-xs">{erro}</div>
        )}
        {msg && (
          <div className="mt-3 px-4 py-3 rounded-lg bg-green-950 border border-green-900 text-green-400 text-xs">{msg}</div>
        )}

        <button
          onClick={modo === 'login' ? handleLogin : handleRecuperar}
          disabled={loading}
          className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Enviar e-mail'}
        </button>

        <div className="mt-5 text-center flex flex-col gap-2">
          {modo === 'login' && (
            <button onClick={() => { setModo('recuperar'); reset() }} className="text-xs text-gray-500 hover:text-gray-400 underline bg-transparent border-none cursor-pointer">
              Esqueci minha senha
            </button>
          )}
          {modo === 'recuperar' && (
            <button onClick={() => { setModo('login'); reset() }} className="text-xs text-primary hover:text-primary-600 underline bg-transparent border-none cursor-pointer">
              ← Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function traduzErro(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('User already registered')) return 'Este e-mail ja esta cadastrado.'
  if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.'
  return msg
}
