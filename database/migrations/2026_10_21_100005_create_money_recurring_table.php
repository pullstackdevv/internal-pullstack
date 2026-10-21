<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('money_recurring', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('wallet_id')->constrained('money_wallets');
            $table->foreignId('category_id')->nullable()->constrained('money_categories')->nullOnDelete();
            $table->string('type'); // income|expense
            $table->unsignedBigInteger('amount');
            $table->unsignedTinyInteger('day_of_month'); // 1-28
            $table->boolean('is_active')->default(true);
            $table->char('last_generated_month', 7)->nullable(); // YYYY-MM
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_recurring');
    }
};
