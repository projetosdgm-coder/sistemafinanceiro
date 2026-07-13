import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { C } from '../styles/tokens'

export default function Login() {
  const [modo, setModo] = useState('login') // login | recuperar
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) setErro(traduzErro(error.message))
    else setMsg('E-mail de recuperação enviado. Verifique sua caixa de entrada.')
    setLoading(false)
  }

  const onEnter = (e) => {
    if (e.key !== 'Enter') return
    if (modo === 'login') handleLogin()
    else handleRecuperar()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.sidebar,
    }}>
      <div style={{
        width: 380, background: '#1a1a1a', borderRadius: 16,
        padding: 40, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ color: C.amarelo, fontWeight: 800, fontSize: 28, letterSpacing: 2 }}>
            ALPHA
          </div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
            Sistema Financeiro
          </div>
        </div>

        {/* Título */}
        <div style={{ color: C.branco, fontWeight: 700, fontSize: 18, marginBottom: 24, textAlign: 'center' }}>
          {modo === 'login' && 'Entrar na sua conta'}
          {modo === 'cadastro' && 'Criar nova conta'}
          {modo === 'recuperar' && 'Recuperar senha'}
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={onEnter}
            style={inputS}
          />
          {modo !== 'recuperar' && (
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={onEnter}
              style={inputS}
            />
          )}
        </div>

        {/* Feedback */}
        {erro && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#3a0000', color: '#FF5252', fontSize: 12 }}>
            {erro}
          </div>
        )}
        {msg && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#0d2a0d', color: '#69F0AE', fontSize: 12 }}>
            {msg}
          </div>
        )}

        {/* Botão principal */}
        <button
          onClick={modo === 'login' ? handleLogin : modo === 'cadastro' ? handleCadastro : handleRecuperar}
          disabled={loading}
          style={{
            width: '100%', marginTop: 20, padding: '13px', borderRadius: 10,
            border: 'none', background: C.amarelo, color: C.preto,
            fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : 'Enviar e-mail'}
        </button>

        {/* Links de alternância */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {modo === 'login' && (
            <button onClick={() => { setModo('recuperar'); reset() }} style={{ ...linkS, color: '#555' }}>
              Esqueci minha senha
            </button>
          )}
          {modo === 'recuperar' && (
            <button onClick={() => { setModo('login'); reset() }} style={linkS}>
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
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.'
  if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.'
  return msg
}

const inputS = {
  padding: '12px 14px', borderRadius: 8,
  border: '1.5px solid #2a2a2a', background: '#111',
  color: '#fff', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

const linkS = {
  background: 'none', border: 'none', color: C.amarelo,
  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  textDecoration: 'underline',
}
