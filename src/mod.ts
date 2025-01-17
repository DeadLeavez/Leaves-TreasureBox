import type { DependencyContainer } from "tsyringe";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import type { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import type { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import type { DatabaseServer } from "@spt/servers/DatabaseServer";

import type { VFS } from "@spt/utils/VFS";
import { jsonc } from "jsonc";
import * as path from "node:path";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import type { IItem } from "@spt/models/eft/common/tables/IItem";

//item creation
import type { CustomItemService } from "@spt/services/mod/CustomItemService";
import type { NewItemFromCloneDetails } from "@spt/models/spt/mod/NewItemDetails";
import type { HashUtil } from "@spt/utils/HashUtil";
import type { JsonUtil } from "@spt/utils/JsonUtil";
import type { IBarterScheme } from "@spt/models/eft/common/tables/ITrader";
import type { HandbookHelper } from "@spt/helpers/HandbookHelper";
import { Money } from "@spt/models/enums/Money";
import type { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import type { ConfigServer } from "@spt/servers/ConfigServer";
import type { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import type { ITraderConfig } from "@spt/models/spt/config/ITraderConfig";
import type { IInventoryConfig } from "@spt/models/spt/config/IInventoryConfig";
import type { IQuestConfig } from "@spt/models/spt/config/IQuestConfig";
import type { IGlobals } from "@spt/models/eft/common/IGlobals";

class TreasureBox implements IPostDBLoadMod, IPreSptLoadMod
{
    private logger: ILogger;
    private db: DatabaseServer;
    private itemDB: any;

    //Config
    private config: IConfig;
    private vfs: VFS;

    private hashUtil: HashUtil;
    private jsonUtil: JsonUtil;
    private handbookHelper: HandbookHelper;
    private customItemService: CustomItemService;
    private configServer: ConfigServer;
    private botConfig: IBotConfig;
    private traderConfig: ITraderConfig;
    private inventoryConfig: IInventoryConfig;
    private questConfig: IQuestConfig;
    private globals: IGlobals;

    public preSptLoad( container: DependencyContainer ): void
    {
        this.vfs = container.resolve<VFS>( "VFS" );
        const configFile = path.resolve( __dirname, "../config/config.jsonc" );
        this.logger = container.resolve<ILogger>( "WinstonLogger" );
        this.configServer = container.resolve<ConfigServer>( "ConfigServer" );
        this.config = jsonc.parse( this.vfs.readFile( configFile ) );

        this.traderConfig = this.configServer.getConfig<ITraderConfig>( ConfigTypes.TRADER );
        this.inventoryConfig = this.configServer.getConfig<IInventoryConfig>( ConfigTypes.INVENTORY );
        this.questConfig = this.configServer.getConfig<IQuestConfig>( ConfigTypes.QUEST );

        this.printColor( "[TreasureBox] preAki Starting" );

        if ( this.config.enableFenceBlacklist )
        {
            this.fenceBlacklist();
        }
    }

    public postDBLoad( container: DependencyContainer ): void
    {
        // Get stuff from container
        this.db = container.resolve<DatabaseServer>( "DatabaseServer" );

        this.hashUtil = container.resolve<HashUtil>( "HashUtil" );
        this.jsonUtil = container.resolve<JsonUtil>( "JsonUtil" );
        this.handbookHelper = container.resolve<HandbookHelper>( "HandbookHelper" );
        this.customItemService = container.resolve<CustomItemService>( "CustomItemService" );
        this.botConfig = this.configServer.getConfig<IBotConfig>( ConfigTypes.BOT );
        this.globals = this.db.getTables().globals;


        // Get tables from database
        const tables = this.db.getTables();
        // Get item database from tables
        this.itemDB = tables.templates.items;

        this.printColor( "[TreasureBox] PostDB Starting" );

        const mods = [ "GLUCK", "M14", "GrenadeLauncherErgo", "PistolScopes", "UMPDrum", "keyDurability", "namelister" ];

        if ( this.config.GLUCK )
        {
            this.GLUCK();
        }
        if ( this.config.M14 )
        {
            this.M14();
        }
        if ( this.config.GrenadeLauncherErgo )
        {
            this.GrenadeLauncherErgo();
        }
        if ( this.config.UMPDrum )
        {
            this.UMPDrum();
        }
        if ( this.config.zeroToHeroPouch )
        {
            this.zeroToHeroPouch( tables );
        }
        if ( this.config.ragfairLevelOverride )
        {
            this.ragfairMinLevelOverride( tables );
        }
        if ( this.config.AK12Muzzles )
        {
            this.ak12muzzle( tables );
        }
        if ( this.config.fuckfakevodka )
        {
            this.fakevodkafix( tables );
        }
        if ( this.config.rpdmods )
        {
            this.RPDMods( tables );
        }

        if ( this.config.memeUSP45 )
        {
            this.memeUsp45();
        }
        if ( this.config.enableTraderRefreshAdjustment )
        {
            this.traderRefresh();
        }
        if ( this.config.enableSuppressorErgoAdjustment )
        {
            this.suppressorErgoAdjustment();
        }
        if ( this.config.m700Barrel )
        {
            this.m700Barrel();
        }
        if ( this.config.enableQuests )
        {
            for( const questID of this.config.quests )
            {
                delete this.questConfig.eventQuests[questID];
            }
            this.inventoryConfig.randomLootContainers["674098588466ebb03408b210"].rewardCount = 4; // CASE
            this.inventoryConfig.randomLootContainers["674098588466ebb03408b210"].rewardTypePool = [
                "57864c8c245977548867e7f1",
                "54009119af1c881c07000029",
                "57864c322459775490116fbf",
                "57864a3d24597754843f8721",
                "57864ee62459775490116fc1",
                "57864e4c24597754843f8723",
                "55818ae44bdc2dde698b456c",
                "550aa4154bdc2dd8348b456b"
            ];

            this.inventoryConfig.randomLootContainers["674078c4a9c9adf0450d59f9"] = structuredClone( this.inventoryConfig.randomLootContainers["674098588466ebb03408b210"] );
        }
        //point output
        if ( this.config.debug )
        {
            const filetoread = path.resolve( __dirname, "../streetsloot.json" );
            const loot = jsonc.parse( this.vfs.readFile( filetoread ) );
            const output = [];
            for ( const point of loot.spawnpoints )
            {
                if ( this.withinCoords( point.template.Position ) )
                {
                    this.printColor( "FOUND TARGETS!", LogTextColor.YELLOW );
                    output.push( point );
                }
            }
            this.writeResult( "output", output, ".json" );
        }
    }

    private m700Barrel()
    {
        const m700ID = "5bfea6e90db834001b7347f3";
        const sa58barrel = "5b099a765acfc47a8607efe3";
        this.itemDB[ m700ID ]._props.Slots[ 2 ]._props.filters[ 0 ].Filter.push( sa58barrel );
    }

    private suppressorErgoAdjustment()
    {
        const suppressorParent = "550aa4cd4bdc2dd8348b456c";
        this.printColor( "[TreasureBox] Suppressor Ergo Adjustment", LogTextColor.CYAN );
        for ( const item in this.itemDB )
        {
            if ( this.itemDB[ item ]._parent === suppressorParent )
            {
                this.itemDB[ item ]._props.Ergonomics += this.config.suppressorErgoAdjustment;
            }
        }
    }

    private memeUsp45()
    {
        this.printColor( "[TreasureBox] MemeUSP45", LogTextColor.CYAN );
        const USP45ID = "6193a720f8ee7e52e42109ed";
        this.itemDB[ USP45ID ]._props.Slots[ 6 ]._props.filters[ 0 ].Filter.push( "6357c98711fb55120211f7e1" );
    }

    private traderRefresh()
    {
        this.printColor( "[TreasureBox] Trader Refresh Adjustment", LogTextColor.CYAN );

        const adjustmentMin = this.config.traderRefreshTimeAdjustmentMin;
        const adjustmentMax = this.config.traderRefreshTimeAdjustmentMax;
        const adjustmentLimit = this.config.traderRefreshTimeAdjustmentLimit;
        const updateTimes = this.traderConfig.updateTime;
        for ( const trader of updateTimes )
        {
            trader.seconds.min += adjustmentMin;
            trader.seconds.max += adjustmentMax;
            if ( trader.seconds.min < adjustmentLimit )
            {
                trader.seconds.min = adjustmentLimit;
            }

            if ( trader.seconds.max < adjustmentLimit )
            {
                trader.seconds.max = adjustmentLimit;
            }

            if ( trader.seconds.min > trader.seconds.max )
            {
                trader.seconds.min = trader.seconds.max;
            }
        }
    }

    private fenceBlacklist()
    {
        this.printColor( "[TreasureBox] Fence Blacklisting stuff", LogTextColor.CYAN );
        const fenceBlacklist = this.config.fenceBlacklist;

        for ( const entry of fenceBlacklist )
        {
            this.printColor( `[TreasureBox] \tBlacklisting: ${ entry }`, LogTextColor.YELLOW );
            this.traderConfig.fence.blacklist.push( entry );
        }
        //this.debugJsonOutput( this.traderConfig.fence.blacklist, "Fence Blacklist" );
    }

    private RPDMods( tables: IDatabaseTables )
    {
        this.printColor( "[TreasureBox] RPD mods", LogTextColor.CYAN );
        //RPD and RPDN
        const rpdIDs = [ "6513ef33e06849f06c0957ca", "65268d8ecb944ff1e90ea385" ];
        const rpdLongBarrel = "6513eff1e06849f06c0957d4";
        const rpdShortBarrel = "65266fd43341ed9aa903dd56";
        const ak103 = "5ac66d2e5acfc43b321d4b53";
        const gastubeID = "59c6633186f7740cf0493bb9";
        const ak103muzzlefilters = tables.templates.items[ ak103 ]._props.Slots[ 2 ]._props.filters[ 0 ].Filter;

        //Both barrels
        for ( const item of ak103muzzlefilters )
        {
            this.itemDB[ rpdLongBarrel ]._props.Slots[ 1 ]._props.filters[ 0 ].Filter.push( item );
            this.itemDB[ rpdShortBarrel ]._props.Slots[ 0 ]._props.filters[ 0 ].Filter.push( item );
        }

        //Both RPDs
        for ( const weaponID of rpdIDs )
        {
            //Add hg to the rpd from the gastuba
            for ( const hgID of this.itemDB[ gastubeID ]._props.Slots[ 0 ]._props.filters[ 0 ].Filter )
            {
                this.itemDB[ weaponID ]._props.Slots[ 3 ]._props.filters[ 0 ].Filter.push( hgID );
            }
        }
    }

    private withinCoords( position: any )
    {
        const x = position.x;
        const y = position.y;
        const z = position.z;
        if ( x < 180 || x > 190 )
        {
            return false;
        }
        if ( y < 5 || y > 15 )
        {
            return false;
        }
        if ( z < 50 || z > 70 )
        {
            return false;
        }
        return true;
    }

    private fakevodkafix( tables: IDatabaseTables )
    {
        this.printColor( "[TreasureBox] Fuck Fake Vodka", LogTextColor.CYAN );
        const fakeVodkaID = "614451b71e5874611e2c7ae5";
        tables.locales.global.en[ `${ fakeVodkaID } Name` ] = "Fake Vodka from Hell";
        tables.locales.global.en[ `${ fakeVodkaID } ShortName` ] = "ASS Vodka";
        tables.locales.global.en[ `${ fakeVodkaID } Description` ] =
            "What you've just found is one of the most insanely idiotic things someone has ever brewed. " +
            "At no point in it's awful, incoherent brewing was it even close to anything that could be considered a reasonable vodka. " +
            "Everyone in tarkov is now dumber for having tasted it. I award it no points, and may God have mercy on it's soul. ";
    }

    private ak12muzzle( tables: IDatabaseTables )
    {
        this.printColor( "[TreasureBox] AK 12 muzzle enabled", LogTextColor.CYAN );
        const ak12 = "6499849fc93611967b034949";
        const ak105 = "5ac66d9b5acfc4001633997a";

        const ak105filters = tables.templates.items[ ak105 ]._props.Slots[ 2 ]._props.filters[ 0 ].Filter;
        const ak12filters = tables.templates.items[ ak12 ]._props.Slots[ 2 ]._props.filters[ 0 ].Filter;
        let count = 0;
        for ( const item of ak105filters )
        {
            ak12filters.push( item );
            count++;
        }
        this.printColor( `[TreasureBox] \tAdded this many new muzzles to the ak12: ${ count }`, LogTextColor.YELLOW );
    }

    private ragfairMinLevelOverride( tables: IDatabaseTables )
    {
        this.printColor( "[TreasureBox] Ragfail min level override enabled", LogTextColor.CYAN );
        tables.globals.config.RagFair.minUserLevel = this.config.ragFairMinUserLevel;
        this.printColor( `[TreasureBox] \tRagfair min level overriden to: ${ this.config.ragFairMinUserLevel }`, LogTextColor.YELLOW );
    }

    private zeroToHeroPouch( tables: IDatabaseTables )
    {
        this.printColor( "[TreasureBox] Zero to Hero pouch Enabled", LogTextColor.CYAN );
        for ( const item of tables.templates.profiles[ "SPT Zero to hero" ].bear.character.Inventory.items )
        {
            if ( item._tpl === "544a11ac4bdc2d470e8b456a" )
            {
                item._tpl = "5732ee6a24597719ae0c0281";
            }
        }
        for ( const item of tables.templates.profiles[ "SPT Zero to hero" ].usec.character.Inventory.items )
        {
            if ( item._tpl === "544a11ac4bdc2d470e8b456a" )
            {
                item._tpl = "5732ee6a24597719ae0c0281";
            }
        }
    }

    private UMPDrum()
    {
        this.printColor( "[TreasureBox] UMPDrum enabled.", LogTextColor.CYAN );
        //Generate the new weapons
        //generate data
        const peacekeeperID = "5935c25fb3acc3127c3d8cd9";
        const mechanicID = "5a7c2eca46aef81a7ca2145d";
        const m4drumID = "59c1383d86f774290a37e0ca";
        const newLocaleName = ".45 ACP Magpul PMAG D-60 60-round magazine";

        //const newName = this.itemDB[weapon]._name;
        const newName = newLocaleName;
        const price = 25000;
        const newID = `6773b8832c3a1a1c5e32af68`;

        const leaves45: NewItemFromCloneDetails = {
            itemTplToClone: m4drumID,
            overrideProperties: {
                Cartridges: [
                    {
                        _id: this.hashUtil.generate(),
                        _max_count: 50,
                        _name: "cartridges",
                        _parent: newID,
                        _props: {
                            filters: [
                                {
                                    Filter: [ "5e81f423763d9f754677bf2e", "5efb0cabfb3e451d70735af5", "5efb0fc6aeb21837e749c801", "5efb0d4f4bc50b58e81710f3", "5ea2a8e200685063ec28c05a" ],
                                },
                            ],
                        },
                        _proto: "5748538b2459770af276a261",
                    },
                ],
            },
            newId: newID,
            parentId: "5448bc234bdc2d3c308b4569",
            handbookParentId: "5b5f754a86f774094242f19b",
            fleaPriceRoubles: price,
            handbookPriceRoubles: price,
            locales: {
                en: {
                    name: newLocaleName,

                    shortName: newName,
                    description: "Drum mag for the UMP45 HELL YISS BRUTHA.",
                },
            },
        };

        this.customItemService.createItemFromClone( leaves45 );

        //Add the mag to the ump
        this.itemDB[ "5fc3e272f8b6a877a729eac5" ]._props.Slots[ 0 ]._props.filters[ 0 ].Filter.push( newID );

        if ( this.config.UMPDrumVector )
        {
            this.printColor( "[TreasureBox] \tUMPDrum enabled for vector.", LogTextColor.YELLOW );

            //Add the mag to the vector
            this.itemDB[ "5fb64bc92b1b027b1f50bcf2" ]._props.Slots[ 0 ]._props.filters[ 0 ].Filter.push( newID );
        }

        const item = this.itemDB[ newID ];

        if ( this.config.UMPDrumAddToTraders )
        {
            this.printColor( "[TreasureBox] \tUMPDrum added to traders.", LogTextColor.YELLOW );

            // Create barter scheme object
            const barterSchemeToAdd: IBarterScheme = {
                count: this.handbookHelper.getTemplatePrice( newID ),
                _tpl: Money.ROUBLES,
            };

            // Create item object
            const itemToAdd: IItem = {
                _id: item._id,
                _tpl: item._id,
                parentId: "hideout",
                slotId: "hideout",
                upd: {
                    StackObjectsCount: 9999999,
                    UnlimitedCount: true,
                },
            };

            const pkassort = this.db.getTables().traders[ peacekeeperID ].assort;
            const meassort = this.db.getTables().traders[ mechanicID ].assort;

            // add item to assort
            pkassort.items.push( itemToAdd );
            pkassort.barter_scheme[ item._id ] = [ [ barterSchemeToAdd ] ];
            pkassort.loyal_level_items[ item._id ] = 3;

            meassort.items.push( itemToAdd );
            meassort.barter_scheme[ item._id ] = [ [ barterSchemeToAdd ] ];
            meassort.loyal_level_items[ item._id ] = 3;
        }
    }

    private GrenadeLauncherErgo()
    {
        this.printColor( "[TreasureBox] GrenadeLauncherErgo enabled.", LogTextColor.CYAN );

        for ( const item in this.itemDB )
        {
            // Find all launchers
            if ( this.itemDB[ item ]._parent === "55818b014bdc2ddc698b456b" )
            {
                this.itemDB[ item ]._props.Ergonomics = -10;
                this.printColor( `[TreasureBox] \tGrenadeLauncherErgo - Edited. ${ this.itemDB[ item ]._name } to ${ this.config.GrenadeLauncherErgoValue }`, LogTextColor.YELLOW );
            }
        }
    }

    private M14()
    {
        this.printColor( "[TreasureBox] M14 enabled.", LogTextColor.CYAN );
        const M1A = "5aafa857e5b5b00018480968";
        this.itemDB[ M1A ]._props.bFirerate = 725;
        this.itemDB[ M1A ]._props.weapFireType = [ "single", "fullauto" ];
    }

    private GLUCK()
    {
        this.printColor( "[TreasureBox] GLUCK enabled.", LogTextColor.CYAN );
        const glock17 = this.itemDB[ "5a7ae0c351dfba0017554310" ];

        const glock18 = this.itemDB[ "5b1fa9b25acfc40018633c01" ];

        for ( let i = 0; i < glock18._props.Slots.length; i++ )
        {
            for ( const filterID in glock17._props.Slots[ i ]._props.filters[ 0 ].Filter )
            {
                glock18._props.Slots[ i ]._props.filters[ 0 ].Filter.push( glock17._props.Slots[ i ]._props.filters[ 0 ].Filter[ filterID ] );
            }
        }
    }

    private printColor( message: string, color: LogTextColor = LogTextColor.GREEN )
    {
        this.logger.logWithColor( message, color );
    }

    private debugJsonOutput( jsonObject: any, label = "" )
    {
        //if ( this.config.debug )
        //{
        if ( label.length > 0 )
        {
            this.logger.logWithColor( `[${ label }]`, LogTextColor.GREEN );
        }
        this.logger.logWithColor( JSON.stringify( jsonObject, null, 4 ), LogTextColor.MAGENTA );
        //}
    }
    private writeResult( prefix: string, data: any, extension = ".json" ): void
    {
        // get formatted text to save
        const text = this.jsonUtil.serialize( data, true );

        // get file name
        const fileName = `E:/SPT-AKI/SPT-3.8.0-2024-03-29-50f50808/user/mods/leaves-treasurebox/${ prefix }${ extension }`;

        // save file
        this.vfs.writeFile( fileName, text );
        this.logger.info( `Written results to: ${ fileName }` );
    }
}

module.exports = { mod: new TreasureBox() };
