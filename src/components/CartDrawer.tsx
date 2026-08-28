import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CartDrawer() {
  const {
    items, isOpen, closeCart, removeCourse, updateQuantity,
    subtotal, couponDiscount, total, appliedCoupon, applyCoupon, removeCoupon, clearCart,
  } = useCart();
  const { navigate } = useRouter();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleCheckout = () => {
    closeCart();
    navigate({ name: 'checkout' });
  };

  const handleContinue = () => {
    closeCart();
    navigate({ name: 'home' });
    setTimeout(() => document.querySelector('#cursos')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput);
    if (ok) {
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Cupom inválido');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[120] bg-noir/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[130] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-graphite transition-transform duration-400 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-pharos-red" />
            <span className="font-display text-lg font-semibold text-white">
              Carrinho
            </span>
            <span className="rounded-full bg-pharos-red px-2 py-0.5 text-xs font-bold text-white">
              {items.length}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-md text-steel transition-colors hover:text-white"
            aria-label="Fechar carrinho"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-graphite-2">
              <ShoppingBag className="h-8 w-8 text-steel" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold text-white">
              Seu carrinho está vazio
            </h3>
            <p className="mt-2 text-sm text-steel">
              Explore nossos cursos e adicione uma formação para começar.
            </p>
            <button onClick={handleContinue} className="btn-primary mt-6">
              Ver cursos
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.course.id}
                    className="flex gap-3 rounded-lg border border-white/10 bg-graphite-2/60 p-3"
                  >
                    <img
                      src={item.course.image}
                      alt={item.course.imageAlt}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-snug text-white">
                          {item.course.title}
                        </h4>
                        <button
                          onClick={() => removeCourse(item.course.id)}
                          className="shrink-0 text-steel transition-colors hover:text-red-400"
                          aria-label={`Remover ${item.course.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-xs text-steel">{item.course.category}</div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.course.id, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-white/15 text-steel transition-colors hover:border-pharos-red hover:text-white disabled:opacity-30"
                            disabled={item.quantity <= 1}
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.course.id, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-white/15 text-steel transition-colors hover:border-pharos-red hover:text-white"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-display text-sm font-bold text-white">
                          {formatPrice(item.course.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-5 rounded-lg border border-white/10 bg-graphite-2/40 p-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-green-500" />
                      Cupom <span className="font-semibold">{appliedCoupon}</span> aplicado
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-steel transition-colors hover:text-red-400"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-steel">
                      <Tag className="h-3.5 w-3.5" />
                      Cupom de desconto
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Digite o cupom"
                        className="input-field flex-1 py-2 text-sm"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-pharos-red hover:text-pharos-red"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="mt-1.5 text-xs text-red-400">{couponError}</p>}
                    <p className="mt-2 text-[10px] text-steel/60">
                      Experimente: PHAROS10 ou BEMVINDO
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Footer / summary */}
            <div className="border-t border-white/10 p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-steel">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Desconto</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-2 font-display text-base font-bold text-white">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button onClick={handleCheckout} className="btn-primary mt-4 w-full">
                Finalizar matrícula
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={handleContinue} className="btn-ghost mt-2 w-full">
                Continuar comprando
              </button>
              <button
                onClick={clearCart}
                className="mt-1 w-full text-center text-xs text-steel transition-colors hover:text-red-400"
              >
                Limpar carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
