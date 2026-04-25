# Backend Fix: Include Owner in Field Cluster API

## Vấn đề
API `GET /api/public/field-clusters/{id}` không trả về owner relationship, dẫn đến QR code không hiển thị.

## Giải pháp

### 1. Controller: FieldClusterController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\FieldCluster;
use Illuminate\Http\Request;

class FieldClusterController extends Controller
{
    /**
     * Get field cluster detail
     * GET /api/public/field-clusters/{id}
     */
    public function show($id)
    {
        $cluster = FieldCluster::with('owner')  // ← THÊM DÒ NÀY
            ->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $cluster
        ]);
    }
}
```

### 2. Model: FieldCluster.php

Đảm bảo có relationship:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FieldCluster extends Model
{
    protected $table = 'field_clusters';
    
    // Relationship with Owner
    public function owner()
    {
        return $this->belongsTo(Owner::class, 'owner_id');
    }
    
    // Other relationships...
}
```

### 3. Model: Owner.php

Đảm bảo có field qr_code_image:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Owner extends Model
{
    protected $table = 'owners';
    
    protected $fillable = [
        'user_id',
        'business_name',
        'code_id',
        'address',
        'qr_code_image', // ← QR code URL from Supabase
    ];
}
```

### 4. Database Migration (nếu chưa có column)

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('owners', function (Blueprint $table) {
            if (!Schema::hasColumn('owners', 'qr_code_image')) {
                $table->string('qr_code_image', 1000)->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('owners', function (Blueprint $table) {
            $table->dropColumn('qr_code_image');
        });
    }
};
```

### 5. API Response Example

**BEFORE (❌ Sai):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "owner_id": 5,
    "name": "Sân Bóng ABC",
    "address": "123 Đường XYZ"
  }
}
```

**AFTER (✅ Đúng):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "owner_id": 5,
    "name": "Sân Bóng ABC",
    "address": "123 Đường XYZ",
    "owner": {
      "id": 5,
      "user_id": 10,
      "business_name": "Công ty ABC",
      "qr_code_image": "https://xxx.supabase.co/storage/v1/object/public/image/owner-qr-codes/1714089800000-xyz789.jpg"
    }
  }
}
```

## Test

1. Gọi API: `GET http://localhost:8000/api/public/field-clusters/1`
2. Check response có owner không
3. Check owner.qr_code_image có URL không
4. Reload frontend và xem QR code hiển thị

## Update API PUT /owner/profile

Đảm bảo API này cũng xử lý qr_code_image:

```php
public function updateProfile(Request $request)
{
    $validated = $request->validate([
        'business_name' => 'nullable|string',
        'address' => 'nullable|string',
        'qr_code_image' => 'nullable|url|max:1000', // ← URL from Supabase
    ]);

    $user = Auth::user();
    $owner = $user->owner;

    if ($request->has('qr_code_image')) {
        // LƯU FULL URL, KHÔNG được cắt bỏ domain!
        $owner->qr_code_image = $validated['qr_code_image'];
    }
    
    // Update other fields...
    $owner->save();

    return response()->json([
        'success' => true,
        'data' => $owner
    ]);
}
```

## ⚠️ QUAN TRỌNG: Kiểm tra database

Sau khi owner upload QR code, CHECK database:

```sql
-- Check QR code URL
SELECT id, business_name, qr_code_image FROM owners WHERE id = 1;
```

**Giá trị ĐÚNG:**
```
https://xxx.supabase.co/storage/v1/object/public/image/owner-qr-codes/1714089800000-xyz789.jpg
```

**Giá trị SAI (thiếu domain):**
```
owner_qr_codes/1714089800000-xyz789.jpg  ❌
/storage/v1/object/public/image/owner_qr_codes/...  ❌
```

Nếu bị sai → Backend đang cắt URL, cần fix validation/logic lưu database.

## Fix nếu database đã có relative path

Nếu owner đã upload nhưng lưu sai format, có 2 cách:

### Cách 1: Owner upload lại (Frontend)
1. Đăng nhập Owner
2. Vào Profile
3. Upload lại QR code mới

### Cách 2: Update manual database (Backend/SQL)
```sql
-- Nếu có relative path, convert thành full URL
UPDATE owners 
SET qr_code_image = CONCAT('https://[YOUR_SUPABASE_URL].supabase.co/storage/v1/object/public/image/', qr_code_image)
WHERE qr_code_image NOT LIKE 'https://%' AND qr_code_image IS NOT NULL;
```
