import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AddressModule } from './address/address.module';
import { CategoryModule } from './category/category.module';
import { BrandsModule } from './brands/brands.module';
import { ProductModule } from './product/product.module';
import { AttributeModule } from './attribute/attribute.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentModule } from './payment/payment.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ReviewModule } from './review/review.module';
import { CouponModule } from './coupon/coupon.module';
import { RoleModule } from './role/role.module';
import { ProfileModule } from './profile/profile.module';
import { NotificationModule } from './notification/notification.module';
import { ShipmentModule } from './shipment/shipment.module';
import { SearchModule } from './search/search.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { TagsModule } from './tags/tags.module';
import { UnitModule } from './unit/unit.module';
import { SupplierModule } from './supplier/supplier.module';
import { BranchModule } from './branch/branch.module';
import { ChannelModule } from './channel/channel.module';
import { VatModule } from './vat/vat.module';
import { SettingsModule } from './settings/settings.module';
import { PoliciesModule } from './policies/policies.module';
import { SectionsModule } from './sections/sections.module';
import { ProductDiscountModule } from './product-discount/product-discount.module';
import { CampaignModule } from './campaign/campaign.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    AddressModule,
    CategoryModule,
    BrandsModule,
    ProductModule,
    AttributeModule,
    CartModule,
    OrderModule,
    InventoryModule,
    PaymentModule,
    WishlistModule,
    ReviewModule,
    CouponModule,
    RoleModule,
    ProfileModule,
    NotificationModule,
    ShipmentModule,
    SearchModule,
    DashboardModule,
    ActivityLogModule,
    TagsModule,
    UnitModule,
    SupplierModule,
    BranchModule,
    ChannelModule,
    VatModule,
    SettingsModule,
    PoliciesModule,
    SectionsModule,
    ProductDiscountModule,
    CampaignModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // JwtAuthGuard runs first globally to populate req.user from JWT token.
    // Endpoints without @UseGuards(JwtAuthGuard) or with @Public() decorator are skipped.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // RolesGuard runs second globally after req.user is populated.
    // Endpoints without @Roles() are unrestricted by role.
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
