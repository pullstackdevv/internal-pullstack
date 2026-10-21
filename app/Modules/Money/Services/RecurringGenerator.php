<?php

namespace App\Modules\Money\Services;

use App\Models\User;
use App\Modules\Money\Models\MoneyRecurring;
use App\Modules\Money\Models\MoneyTransaction;
use Illuminate\Support\Carbon;

class RecurringGenerator
{
    /**
     * Create this month's transaction for every active rule that has not been
     * generated yet for the current month. Returns how many were created.
     * Idempotent within a month via last_generated_month.
     */
    public function generateForCurrentMonth(User $actor): int
    {
        $month = now()->format('Y-m');
        $created = 0;

        MoneyRecurring::where('is_active', true)
            ->where(fn ($q) => $q->whereNull('last_generated_month')->orWhere('last_generated_month', '!=', $month))
            ->each(function (MoneyRecurring $rule) use ($actor, $month, &$created) {
                $day = min($rule->day_of_month, now()->daysInMonth);
                $date = Carbon::create(now()->year, now()->month, $day);

                MoneyTransaction::create([
                    'wallet_id' => $rule->wallet_id,
                    'category_id' => $rule->category_id,
                    'type' => $rule->type,
                    'amount' => $rule->amount,
                    'date' => $date->toDateString(),
                    'note' => $rule->name,
                    'created_by' => $actor->id,
                ]);

                $rule->update(['last_generated_month' => $month]);
                $created++;
            });

        return $created;
    }
}
